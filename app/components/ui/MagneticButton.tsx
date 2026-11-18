"use client";

import { ReactNode } from "react";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
}

export default function MagneticButton({
  children,
  className = "",
}: MagneticButtonProps) {
  return (
    <div
      className={`inline-block transition-transform duration-200 ease-out motion-safe:hover:scale-[1.02] ${className}`}
    >
      {children}
    </div>
  );
}
