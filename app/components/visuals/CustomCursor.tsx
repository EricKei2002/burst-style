"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    const mql = window.matchMedia("(pointer: coarse)");
    const onChange = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    
    // Set initial value
    setTimeout(() => setIsTouch(mql.matches), 0);
    
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useGSAP(() => {
    if (isTouch) return;
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    
    if (!cursor || !follower) return;
    
    // Initial position off-screen
    gsap.set(cursor, { xPercent: -50, yPercent: -50, opacity: 0 });
    gsap.set(follower, { xPercent: -50, yPercent: -50, opacity: 0 });

    const handleMouseMove = (e: MouseEvent) => {
      // Improve initial load opacity
      gsap.to([cursor, follower], { opacity: 1, duration: 0.2 });

      // Cursor moves instantly
      gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0 });
      
      // Follower moves with delay
      gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.15 });
    };

    const handleHoverStart = () => setIsHovering(true);
    const handleHoverEnd = () => setIsHovering(false);

    window.addEventListener("mousemove", handleMouseMove);
    
    // Add listeners for hover targets
    const hoverTargets = document.querySelectorAll("a, button, .trigger-btn, input, textarea");
    hoverTargets.forEach((el) => {
      el.addEventListener("mouseenter", handleHoverStart);
      el.addEventListener("mouseleave", handleHoverEnd);
    });

    // Observer for dynamic elements
    const observer = new MutationObserver(() => {
        const newTargets = document.querySelectorAll("a, button, .trigger-btn, input, textarea");
        newTargets.forEach((el) => {
            el.removeEventListener("mouseenter", handleHoverStart);
            el.removeEventListener("mouseleave", handleHoverEnd);
            el.addEventListener("mouseenter", handleHoverStart);
            el.addEventListener("mouseleave", handleHoverEnd);
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      hoverTargets.forEach((el) => {
         el.removeEventListener("mouseenter", handleHoverStart);
         el.removeEventListener("mouseleave", handleHoverEnd);
      });
      observer.disconnect();
    };
  }, [isTouch]);

  useEffect(() => {
    if (isTouch) return;
    // Animate cursor scale based on hover state
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    
    if (!cursor || !follower) return;
    
    if (isHovering) {
        gsap.to(cursor, { scale: 0.5, duration: 0.2 });
        gsap.to(follower, { scale: 2, backgroundColor: "rgba(255, 255, 255, 0.2)", duration: 0.2 });
    } else {
        gsap.to(cursor, { scale: 1, duration: 0.2 });
        gsap.to(follower, { scale: 1, backgroundColor: "transparent", duration: 0.2 });
    }
  }, [isHovering, isTouch]);

  if (isTouch) return null;

  return (
    <>
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-3 h-3 bg-white rounded-full pointer-events-none mix-blend-difference"
        style={{ zIndex: 9999 }}
      />
      <div 
        ref={followerRef} 
        className="fixed top-0 left-0 w-10 h-10 border border-white rounded-full pointer-events-none mix-blend-difference"
        style={{ zIndex: 9998 }}
      />
    </>
  );
}
