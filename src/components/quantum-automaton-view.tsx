"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useIsMounted } from '@/hooks/use-is-mounted';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  CellVisibilityMode,
  FrameDisplayMode,
  InitPattern,
} from '@/app/page';

type QuantumAutomatonViewProps = {
  isRunning: boolean;
  speed: number;
  transparency: number;
  gridSize: number;
  initPattern: InitPattern;
  resetToken: number;
  frameDisplayMode: FrameDisplayMode;
  cellVisibilityMode: CellVisibilityMode;
};

const CELL_SIZE = 1;
const CELL_GAP = 0.2;
const TOTAL_CELL_SIZE = CELL_SIZE + CELL_GAP;
const NEIGHBOR_COUNT = 26;

type GridState = {
  size: number;
  buffers: [Float32Array, Float32Array];
  activeBufferIndex: 0 | 1;
  neighbors: Uint32Array;
};

export function QuantumAutomatonView({
  isRunning,
  speed,
  transparency,
  gridSize,
  initPattern,
  resetToken,
  frameDisplayMode,
  cellVisibilityMode,
}: QuantumAutomatonViewProps) {
  const isMounted = useIsMounted();
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const gridRef = useRef<GridState | null>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const instanceOpacityAttributeRef = useRef<
    THREE.InstancedBufferAttribute | null
  >(null);
  const lastTickTimeRef = useRef(0);
  const frameIdRef = useRef<number>();
  const tickCountRef = useRef(0);
  const frameDisplayModeRef = useRef<FrameDisplayMode>(frameDisplayMode);
  const speedRef = useRef(speed);
  const transparencyRef = useRef(transparency);
  const cellVisibilityModeRef = useRef<CellVisibilityMode>(cellVisibilityMode);
  const redColorRef = useRef(new THREE.Color(0xff0000));
  const blueColorRef = useRef(new THREE.Color(0x0000ff));
  const midColorRef = useRef(new THREE.Color(0xffffff));
  const tempColorRef = useRef(new THREE.Color());

  const initGrid = useCallback(() => {
    const totalCells = gridSize * gridSize * gridSize;
    const buffers: [Float32Array, Float32Array] = [
      new Float32Array(totalCells),
      new Float32Array(totalCells),
    ];

    const primaryBuffer = buffers[0];
    const sizeSquared = gridSize * gridSize;

    if (initPattern === 'dots') {
      for (let x = 1; x < gridSize; x += 3) {
        for (let y = 1; y < gridSize; y += 3) {
          for (let z = 1; z < gridSize; z += 3) {
            if (x < gridSize && y < gridSize && z < gridSize) {
              const index = x * sizeSquared + y * gridSize + z;
              primaryBuffer[index] = 1;
            }
          }
        }
      }
    } else {
      for (let i = 0; i < totalCells; i++) {
        primaryBuffer[i] = Math.random();
      }
    }

    const neighbors = new Uint32Array(totalCells * NEIGHBOR_COUNT);
    const neighborOffsets = [-1, 0, 1];
    let neighborWriteIndex = 0;

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          for (const dx of neighborOffsets) {
            for (const dy of neighborOffsets) {
              for (const dz of neighborOffsets) {
                if (dx === 0 && dy === 0 && dz === 0) {
                  continue;
                }
                const nx = (x + dx + gridSize) % gridSize;
                const ny = (y + dy + gridSize) % gridSize;
                const nz = (z + dz + gridSize) % gridSize;
                neighbors[neighborWriteIndex++] =
                  nx * sizeSquared + ny * gridSize + nz;
              }
            }
          }
        }
      }
    }

    gridRef.current = {
      size: gridSize,
      buffers,
      activeBufferIndex: 0,
      neighbors,
    };
  }, [gridSize, initPattern]);

  const updateSimulation = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const { buffers, neighbors } = grid;
    const currentBufferIndex = grid.activeBufferIndex;
    const nextBufferIndex: 0 | 1 = currentBufferIndex === 0 ? 1 : 0;
    const currentBuffer = buffers[currentBufferIndex];
    const nextBuffer = buffers[nextBufferIndex];
    const totalCells = currentBuffer.length;

    for (let i = 0; i < totalCells; i++) {
      let neighborSum = 0;
      const neighborOffset = i * NEIGHBOR_COUNT;
      for (let j = 0; j < NEIGHBOR_COUNT; j++) {
        neighborSum += 1.0 - currentBuffer[neighbors[neighborOffset + j]];
      }

      const avg = neighborSum / NEIGHBOR_COUNT;
      let newState = Math.abs(currentBuffer[i] - avg);
      if (newState < 0) newState = 0;
      if (newState > 1) newState = 1;
      nextBuffer[i] = newState;
    }
    grid.activeBufferIndex = nextBufferIndex;
  }, []);

  const updateMeshes = useCallback(() => {
    const grid = gridRef.current;
    const instancedMesh = instancedMeshRef.current;
    const opacityAttribute = instanceOpacityAttributeRef.current;
    if (!grid || !instancedMesh || !opacityAttribute) return;

    const buffer = grid.buffers[grid.activeBufferIndex];
    const opacityMultiplier = transparencyRef.current / 100;
    const sizeSquared = grid.size * grid.size;
    const visibilityMode = cellVisibilityModeRef.current;

    const redColor = redColorRef.current;
    const blueColor = blueColorRef.current;
    const midColor = midColorRef.current;
    const tempColor = tempColorRef.current;

    const opacities = opacityAttribute.array as Float32Array;

    const instanceColor = instancedMesh.instanceColor;
    if (!instanceColor) return;

    for (let x = 0; x < grid.size; x++) {
      for (let y = 0; y < grid.size; y++) {
        for (let z = 0; z < grid.size; z++) {
          const cellIndex = x * sizeSquared + y * grid.size + z;
          const value = buffer[cellIndex] ?? 0;

          const opacity = (1.0 - 2.0 * Math.abs(value - 0.5)) * opacityMultiplier;

          if (value < 0.5) {
            tempColor.lerpColors(midColor, redColor, (0.5 - value) * 2);
          } else {
            tempColor.lerpColors(midColor, blueColor, (value - 0.5) * 2);
          }

          instancedMesh.setColorAt(cellIndex, tempColor);

          let effectiveOpacity = opacity;
          if (visibilityMode === 'active' && value < 0.5) {
            effectiveOpacity = 0;
          } else if (visibilityMode === 'inactive' && value >= 0.5) {
            effectiveOpacity = 0;
          }

          opacities[cellIndex] = Math.max(0, Math.min(1, effectiveOpacity));
        }
      }
    }

    instanceColor.needsUpdate = true;
    opacityAttribute.needsUpdate = true;
  }, []);

  useEffect(() => {
    if (!isMounted || !mountRef.current) return;

    if (rendererRef.current) {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      controlsRef.current?.dispose();
      mountRef.current.innerHTML = '';
      if (instancedMeshRef.current) {
        instancedMeshRef.current.geometry.dispose();
        (instancedMeshRef.current.material as THREE.Material).dispose();
      }
      instancedMeshRef.current = null;
      instanceOpacityAttributeRef.current = null;
      rendererRef.current.dispose();
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
    }

    const mount = mountRef.current;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000,
    );
    camera.position.z = gridSize * 1.8;
    camera.position.y = gridSize * 1.2;
    camera.position.x = gridSize * 1.5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.5;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    initGrid();

    const grid = gridRef.current;
    if (!grid) {
      return () => undefined;
    }

    const totalCells = grid.size * grid.size * grid.size;
    const geometry = new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE);
    const gridOffset = (-(grid.size - 1) * TOTAL_CELL_SIZE) / 2;

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      metalness: 0.1,
      roughness: 0.5,
      vertexColors: true,
      depthWrite: false,
    });

    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\nattribute float instanceOpacity;\nvarying float vInstanceOpacity;',
        )
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvInstanceOpacity = instanceOpacity;',
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          '#include <common>\nvarying float vInstanceOpacity;',
        )
        .replace(
          '#include <dithering_fragment>',
          'gl_FragColor.a *= vInstanceOpacity;\n#include <dithering_fragment>',
        );
    };

    const instancedMesh = new THREE.InstancedMesh(geometry, material, totalCells);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const colors = new Float32Array(totalCells * 3);
    instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    instancedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);

    const opacityAttribute = new THREE.InstancedBufferAttribute(
      new Float32Array(totalCells),
      1,
    );
    opacityAttribute.setUsage(THREE.DynamicDrawUsage);
    instancedMesh.geometry.setAttribute('instanceOpacity', opacityAttribute);
    instanceOpacityAttributeRef.current = opacityAttribute;

    const matrix = new THREE.Matrix4();
    let index = 0;
    for (let x = 0; x < grid.size; x++) {
      for (let y = 0; y < grid.size; y++) {
        for (let z = 0; z < grid.size; z++) {
          matrix.makeTranslation(
            x * TOTAL_CELL_SIZE + gridOffset,
            y * TOTAL_CELL_SIZE + gridOffset,
            z * TOTAL_CELL_SIZE + gridOffset,
          );
          instancedMesh.setMatrixAt(index, matrix);
          index += 1;
        }
      }
    }
    instancedMesh.instanceMatrix.needsUpdate = true;

    scene.add(instancedMesh);
    instancedMeshRef.current = instancedMesh;
    updateMeshes();
    lastTickTimeRef.current = 0;
    tickCountRef.current = 0;

    const animate = (time: number) => {
      frameIdRef.current = requestAnimationFrame(animate);

      controlsRef.current?.update();

      if (isRunning) {
        const minDelay = 10;
        const maxDelay = 1000;
        const currentDelay =
          minDelay + ((100 - speedRef.current) / 99) * (maxDelay - minDelay);

        if (time - lastTickTimeRef.current > currentDelay) {
          updateSimulation();
          tickCountRef.current += 1;
          const mode = frameDisplayModeRef.current;
          const shouldRender =
            mode === 'all' ||
            (mode === 'even' && tickCountRef.current % 2 === 0) ||
            (mode === 'odd' && tickCountRef.current % 2 === 1);
          if (shouldRender) {
            updateMeshes();
          }
          lastTickTimeRef.current = time;
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate(0);

    const handleResize = () => {
      if (mountRef.current && cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect =
          mountRef.current.clientWidth / mountRef.current.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(
          mountRef.current.clientWidth,
          mountRef.current.clientHeight,
        );
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      controlsRef.current?.dispose();
      if (mountRef.current) mountRef.current.innerHTML = '';
      if (instancedMeshRef.current) {
        instancedMeshRef.current.geometry.dispose();
        (instancedMeshRef.current.material as THREE.Material).dispose();
      }
      instancedMeshRef.current = null;
      instanceOpacityAttributeRef.current = null;
      rendererRef.current?.dispose();
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, resetToken]);

  useEffect(() => {
    frameDisplayModeRef.current = frameDisplayMode;
    if (isMounted) {
      updateMeshes();
    }
  }, [frameDisplayMode, isMounted, updateMeshes]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    transparencyRef.current = transparency;
    if (isMounted) {
      updateMeshes();
    }
  }, [transparency, isMounted, updateMeshes]);

  useEffect(() => {
    cellVisibilityModeRef.current = cellVisibilityMode;
    if (isMounted) {
      updateMeshes();
    }
  }, [cellVisibilityMode, isMounted, updateMeshes]);

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    if (!scene || !camera) return;

    camera.position.z = gridSize * 1.8;
    camera.position.y = gridSize * 1.2;
    camera.position.x = gridSize * 1.5;
    camera.lookAt(0, 0, 0);
  }, [gridSize]);

  if (!isMounted) {
    return <Skeleton className="h-full w-full rounded-xl" />;
  }

  return <div ref={mountRef} className="h-full w-full outline-none" tabIndex={0} />;
}
