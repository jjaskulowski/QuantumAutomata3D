"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useIsMounted } from '@/hooks/use-is-mounted';
import { Skeleton } from '@/components/ui/skeleton';
import type { InitPattern } from '@/app/page';
import { cn } from '@/lib/utils';

type QuantumAutomatonViewProps = {
  isRunning: boolean;
  speed: number;
  transparency: number;
  gridSize: number;
  initPattern: InitPattern;
  resetToken: number;
  className?: string;
};

const CELL_SIZE = 1;
const CELL_GAP = 0.2;
const TOTAL_CELL_SIZE = CELL_SIZE + CELL_GAP;

const NEIGHBOR_OFFSETS = (() => {
    const offsets = [];
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                if (x === 0 && y === 0 && z === 0) continue;
                offsets.push({ x, y, z });
            }
        }
    }
    return offsets;
})();

export function QuantumAutomatonView({
  isRunning,
  speed,
  transparency,
  gridSize,
  initPattern,
  resetToken,
  className,
}: QuantumAutomatonViewProps) {
  const isMounted = useIsMounted();
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const gridRef = useRef<number[][][]>([]);
  const meshesRef = useRef<THREE.Mesh[][][]>([]);
  const lastTickTimeRef = useRef(0);
  const frameIdRef = useRef<number>();

  const initGrid = useCallback(() => {
    let grid: number[][][] = [];
     if (initPattern === 'dots') {
      grid = Array(gridSize).fill(0).map(() =>
        Array(gridSize).fill(0).map(() =>
          Array(gridSize).fill(0)
        )
      );
      for (let x = 1; x < gridSize; x += 3) {
        for (let y = 1; y < gridSize; y += 3) {
          for (let z = 1; z < gridSize; z += 3) {
            if(x < gridSize && y < gridSize && z < gridSize) {
               grid[x][y][z] = 1;
            }
          }
        }
      }
    } else {
       grid = Array(gridSize).fill(0).map(() =>
        Array(gridSize).fill(0).map(() =>
          Array(gridSize).fill(0).map(() => Math.random())
        )
      );
    }
    gridRef.current = grid;
  }, [gridSize, initPattern]);

  const updateSimulation = useCallback(() => {
    const currentGrid = gridRef.current;
    const newGrid = currentGrid.map(plane => plane.map(row => row.slice()));

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          let neighborSum = 0;
          for (const offset of NEIGHBOR_OFFSETS) {
            const nx = (x + offset.x + gridSize) % gridSize;
            const ny = (y + offset.y + gridSize) % gridSize;
            const nz = (z + offset.z + gridSize) % gridSize;
            neighborSum += 1.0 - currentGrid[nx][ny][nz];
          }
          const avg = neighborSum / 26;
          
          const oldState = currentGrid[x][y][z];
          let newState = Math.abs(oldState - avg);

          newState = Math.max(0, Math.min(1, newState));

          newGrid[x][y][z] = newState;
        }
      }
    }
    gridRef.current = newGrid;
  }, [gridSize]);
  
  const updateMeshes = useCallback(() => {
    const grid = gridRef.current;
    const meshes = meshesRef.current;
    if (!meshes.length || !grid.length) return;
    const opacityMultiplier = transparency / 100;

    const redColor = new THREE.Color(0xff0000);
    const blueColor = new THREE.Color(0x0000ff);
    const midColor = new THREE.Color(0xffffff);

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          if (meshes[x] && meshes[x][y] && meshes[x][y][z]) {
            const mesh = meshes[x][y][z];
            const value = grid[x]?.[y]?.[z] ?? 0;
            
            // Transparency: 0.5 is opaque, 0 and 1 are transparent
            const opacity = 1.0 - 2.0 * Math.abs(value - 0.5);
            (mesh.material as THREE.MeshStandardMaterial).opacity = opacity * opacityMultiplier;
            
            // Color: < 0.5 is red, > 0.5 is blue
            const color = new THREE.Color();
            if (value < 0.5) {
              // Lerp from white to red
              color.lerpColors(midColor, redColor, (0.5 - value) * 2);
            } else {
              // Lerp from white to blue
              color.lerpColors(midColor, blueColor, (value - 0.5) * 2);
            }
            (mesh.material as THREE.MeshStandardMaterial).color = color;
          }
        }
      }
    }
  }, [gridSize, transparency]);

  useEffect(() => {
    if (!isMounted || !mountRef.current) return;

    if (rendererRef.current) {
        if(frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
        controlsRef.current?.dispose();
        mountRef.current.innerHTML = "";
        meshesRef.current.flat(3).forEach(mesh => {
            if(mesh.geometry) mesh.geometry.dispose();
            if(mesh.material) (mesh.material as THREE.Material).dispose();
        });
        meshesRef.current = [];
        rendererRef.current.dispose();
    }
    
    const mount = mountRef.current;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
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

    const newMeshes: THREE.Mesh[][][] = [];
    const geometry = new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE);
    const gridOffset = -(gridSize - 1) * TOTAL_CELL_SIZE / 2;

    for (let x = 0; x < gridSize; x++) {
      const plane: THREE.Mesh[][] = [];
      for (let y = 0; y < gridSize; y++) {
        const row: THREE.Mesh[] = [];
        for (let z = 0; z < gridSize; z++) {
          const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: gridRef.current[x][y][z] * (transparency / 100),
            metalness: 0.1,
            roughness: 0.5,
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(
            x * TOTAL_CELL_SIZE + gridOffset,
            y * TOTAL_CELL_SIZE + gridOffset,
            z * TOTAL_CELL_SIZE + gridOffset
          );
          scene.add(mesh);
          row.push(mesh);
        }
        plane.push(row);
      }
      newMeshes.push(plane);
    }
    meshesRef.current = newMeshes;
    updateMeshes();
    lastTickTimeRef.current = 0;

    const animate = (time: number) => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      controlsRef.current?.update();

      if (isRunning) {
        const minDelay = 10; 
        const maxDelay = 1000;
        const currentDelay = minDelay + ((100 - speed) / 99) * (maxDelay - minDelay);
  
        if (time - lastTickTimeRef.current > currentDelay) {
          updateSimulation();
          updateMeshes();
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
        cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if(frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      controlsRef.current?.dispose();
      if(mountRef.current) mountRef.current.innerHTML = "";
      meshesRef.current.flat(3).forEach(mesh => {
        if(mesh.geometry) mesh.geometry.dispose();
        if(mesh.material) (mesh.material as THREE.Material).dispose();
      });
      meshesRef.current = [];
      rendererRef.current?.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, resetToken]);

  useEffect(() => {
    if(isMounted) {
      updateMeshes();
    }
  }, [transparency, isMounted, updateMeshes]);

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    if (!scene || !camera) return;

    camera.position.z = gridSize * 1.8;
    camera.position.y = gridSize * 1.2;
    camera.position.x = gridSize * 1.5;
    camera.lookAt(0,0,0)
  }, [gridSize]);


  if (!isMounted) {
    return <Skeleton className={cn("h-full w-full rounded-xl", className)} />;
  }

  return (
    <div
      ref={mountRef}
      className={cn("h-full w-full outline-none", className)}
      tabIndex={0}
    />
  );
}
