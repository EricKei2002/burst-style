"use client";

import { ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

export default function TiltCard({
  children,
  className = "",
}: TiltCardProps) {
  return (
    <div
      style={{ transform: "translateZ(0)" }}
      className={`will-change-transform transition-transform duration-200 ease-out motion-safe:hover:scale-[1.02] ${className}`}
    >
      {children}
    </div>
  );
}
