"use client";

import { useState, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

import * as THREE from "three";
import { usePathname } from "next/navigation";

// Components
import TheSun from "./TheSun";
import Moon from "./Moon";
import Earth from "./Earth";
import ShootingStars from "./ShootingStars";
import SpaceshipInterior from "./SpaceshipInterior";

function WarpStars() {
  const starsRef = useRef<THREE.Points>(null);
  
  // Increase star count for dense hyperspace effect
  const starsCount = 4000;
  
  // Initialize stars in a tunnel/cylinder shape along Z axis
  const [positions] = useState(() => {
    const pos = new Float32Array(starsCount * 3);
    for(let i = 0; i < starsCount; i++) {
        const i3 = i * 3;
        // Spread X and Y wider for immersion
        const x = (Math.random() - 0.5) * 200;
        const y = (Math.random() - 0.5) * 200; 
        // Spawn ahead [0, -200]
        const z = (Math.random() - 0.5) * 200;
        
        pos[i3] = x;
        pos[i3 + 1] = y;
        pos[i3 + 2] = z;
    }
    return pos;
  });

  // Refs for smooth animation values
  const currentSpeed = useRef(0.05);
  const currentStretch = useRef(1);
  
  useFrame((state, delta) => {
    if (!starsRef.current) return;
    
    const positions = starsRef.current.geometry.attributes.position.array as Float32Array;
    
    // Standard movement
    const targetSpeed = 0.05; 
    const targetStretch = 1; 
    
    // Smooth interpolation (Lerp)
    // Adjust factor (e.g., 3 * delta) for acceleration speed
    currentSpeed.current += (targetSpeed - currentSpeed.current) * Math.min(delta * 2, 1);
    currentStretch.current += (targetStretch - currentStretch.current) * Math.min(delta * 2, 1);

    const speed = currentSpeed.current;
    
    for(let i = 0; i < starsCount; i++) {
         const i3 = i * 3;
         positions[i3 + 2] += speed;
         
         // Reset star if it passes camera (z > 20)
         if (positions[i3 + 2] > 50) {
           positions[i3 + 2] = -150; // Reset far back
           
           // Reshuffle X/Y to prevent distinct patterns from forming
           positions[i3] = (Math.random() - 0.5) * 200;
           positions[i3 + 1] = (Math.random() - 0.5) * 200;
         }
    }
    starsRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Apply stretch effect
    starsRef.current.scale.z = currentStretch.current;
    
    // Optional: Fade opacity based on warping?
    // Not needed if white streaks look good.
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={starsCount}
          array={positions}
          itemSize={3}
          args={[positions, 3]} 
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#ffffff"
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
      />
    </points>
  );
}



export default function StarBackground() {
  const pathname = usePathname();
  const isProjectPage = pathname.startsWith('/projects/');

  if (isProjectPage) {
    return <SpaceshipInterior />;
  }

  return (
    <div className="fixed inset-0 -z-50 h-full w-full bg-[#050505]">
      <Canvas
        camera={{ position: [0, 0, 1] }}
        gl={{ alpha: false, antialias: false }}
      >
        <ambientLight intensity={0.1} />
        <Suspense fallback={null}>
          <TheSun />
          <Moon />
          <Earth />
        </Suspense>

        <WarpStars />
        <ShootingStars />
      </Canvas>
    </div>
  );
}
