"use client";

import { ReactNode } from "react";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number; // 引き寄せる力の強さ
}

export default function MagneticButton({ children, className = "", strength = 0.5 }: MagneticButtonProps) {
  void strength;
  
  return (
    <div className={`inline-block transition-transform duration-200 ease-out motion-safe:hover:scale-[1.02] ${className}`}>
      {children}
    </div>
  );
}
