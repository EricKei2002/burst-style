"use client";

import { useRef, ReactNode, useEffect } from "react";
import { gsap } from "gsap";

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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Quick setters for performance
    const setX = gsap.quickTo(el, "rotateX", { duration: 0.5, ease: "power2.out" });
    const setY = gsap.quickTo(el, "rotateY", { duration: 0.5, ease: "power2.out" });
    const setScale = gsap.quickTo(el, "scale", { duration: 0.5, ease: "power2.out" });

    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = el.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5; // -0.5 to 0.5
      const y = (e.clientY - top) / height - 0.5; // -0.5 to 0.5
      
      // RotateX should be inverted relative to Y position (mouse up -> tilt up/look up -> rotateX positive? No, rotateX negative makes top go back)
      // Actually standard: mouse top -> tilt top away? or tilt top towards?
      // "Look at mouse" effect: top part comes closer when mouse is at top? No, usually opposite.
      // Let's try standard tilt: mouse at top left -> top left corner goes down (away).
      
      setY(x * rotationIntensity * 2); // RotateY follows X axis movement
      setX(-y * rotationIntensity * 2); // RotateX inverse to Y axis movement (mouse down -> rotateX positive -> bottom goes away / top comes close)
      setScale(scale);
    };

    const handleMouseLeave = () => {
      setX(0);
      setY(0);
      setScale(1);
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    // Initial style
    gsap.set(el, { transformPerspective: perspective, transformStyle: "preserve-3d" });

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [perspective, scale, rotationIntensity]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
