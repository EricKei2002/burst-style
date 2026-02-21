"use client";

import { ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  perspective?: number;
  scale?: number;
  rotationIntensity?: number;
}

export default function TiltCard({ 
    children, 
    className = "", 
    perspective = 1000,
    scale = 1.02,
    rotationIntensity = 10
}: TiltCardProps) {
  void perspective;
  void rotationIntensity;
  const safeScale = Math.max(1, Math.min(scale, 1.06));

  return (
    <div
      style={{ transform: "translateZ(0)" }}
      className={`will-change-transform transition-transform duration-200 ease-out motion-safe:hover:scale-[1.02] ${className}`}
      data-scale={safeScale}
    >
      {children}
    </div>
  );
}
