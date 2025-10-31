"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useIsMounted } from '@/hooks/use-is-mounted';
import { Skeleton } from '@/components/ui/skeleton';

type QuantumAutomatonViewProps = {
  isRunning: boolean;
  speed: number;
  transparency: number;
  resetToken: number;
};

const GRID_SIZE = 10;
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
  resetToken,
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
    const grid = Array(GRID_SIZE).fill(0).map(() =>
      Array(GRID_SIZE).fill(0).map(() =>
        Array(GRID_SIZE).fill(0).map(() => Math.random())
      )
    );
    gridRef.current = grid;
  }, []);

  const updateSimulation = useCallback(() => {
    const currentGrid = gridRef.current;
    const newGrid = currentGrid.map(plane => plane.map(row => row.slice()));

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let z = 0; z < GRID_SIZE; z++) {
          let neighborSum = 0;
          for (const offset of NEIGHBOR_OFFSETS) {
            const nx = (x + offset.x + GRID_SIZE) % GRID_SIZE;
            const ny = (y + offset.y + GRID_SIZE) % GRID_SIZE;
            const nz = (z + offset.z + GRID_SIZE) % GRID_SIZE;
            neighborSum += currentGrid[nx][ny][nz];
          }
          const avg = neighborSum / 26;
          const oldState = currentGrid[x][y][z];
          
          // New rule: state is influenced by the difference from neighbors, with some randomness
          const diff = oldState - avg;
          let newState = oldState + diff * 0.1 + (Math.random() - 0.5) * 0.02;

          // Clamp the value between 0 and 1
          newState = Math.max(0, Math.min(1, newState));

          newGrid[x][y][z] = newState;
        }
      }
    }
    gridRef.current = newGrid;
  }, []);

  const updateMeshes = useCallback((opacityMultiplier: number) => {
    const grid = gridRef.current;
    const meshes = meshesRef.current;
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let z = 0; z < GRID_SIZE; z++) {
          if (meshes[x] && meshes[x][y] && meshes[x][y][z]) {
            const mesh = meshes[x][y][z];
            (mesh.material as THREE.MeshStandardMaterial).opacity = grid[x][y][z] * opacityMultiplier;
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    initGrid();
    updateMeshes(transparency / 100);
  }, [resetToken, initGrid, updateMeshes, transparency]);


  useEffect(() => {
    if (!isMounted || !mountRef.current) return;

    // Cleanup previous instance
    if (rendererRef.current) {
        rendererRef.current.dispose();
        if (mountRef.current) mountRef.current.innerHTML = '';
    }
    if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
    }
    
    const mount = mountRef.current;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Camera
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.z = GRID_SIZE * 1.8;
    camera.position.y = GRID_SIZE * 1.2;
    camera.position.x = GRID_SIZE * 1.5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.5;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Grid and Meshes
    const newMeshes: THREE.Mesh[][][] = [];
    const geometry = new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE);
    const gridOffset = -(GRID_SIZE - 1) * TOTAL_CELL_SIZE / 2;

    for (let x = 0; x < GRID_SIZE; x++) {
      const plane: THREE.Mesh[][] = [];
      for (let y = 0; y < GRID_SIZE; y++) {
        const row: THREE.Mesh[] = [];
        for (let z = 0; z < GRID_SIZE; z++) {
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
    updateMeshes(transparency/100);

    // Animation Loop
    const animate = (time: number) => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      const currentControls = controlsRef.current;
      if (currentControls) {
        currentControls.update();
      }

      if (isRunning) {
        const maxDelay = 1000;
        const minDelay = 10;
        const currentDelay = maxDelay - ((speed - 1) / 99) * (maxDelay - minDelay);
  
        if (time - lastTickTimeRef.current > currentDelay) {
          updateSimulation();
          updateMeshes(transparency / 100);
          lastTickTimeRef.current = time;
        }
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate(0);

    // Handle resize
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
      
      const currentControls = controlsRef.current;
      if (currentControls) {
          currentControls.dispose();
      }
      
      if(mountRef.current) mountRef.current.innerHTML = "";
      
      meshesRef.current.flat(3).forEach(mesh => {
        if(mesh.geometry) mesh.geometry.dispose();
        if(mesh.material) (mesh.material as THREE.Material).dispose();
      });

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [isMounted, resetToken]);

  useEffect(() => {
    if(isMounted) {
      updateMeshes(transparency / 100);
    }
  }, [transparency, isMounted, updateMeshes]);


  if (!isMounted) {
    return <Skeleton className="h-full w-full rounded-xl" />;
  }

  return <div ref={mountRef} className="h-full w-full outline-none" tabIndex={0} />;
}
