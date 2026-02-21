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
    
    setTimeout(() => setIsTouch(mql.matches), 0);
    
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useGSAP(() => {
    if (isTouch) return;
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    
    if (!cursor || !follower) return;
    
    gsap.set(cursor, { xPercent: -50, yPercent: -50, opacity: 0 });
    gsap.set(follower, { xPercent: -50, yPercent: -50, opacity: 0 });

    const handleMouseMove = (e: MouseEvent) => {
      gsap.to([cursor, follower], { opacity: 1, duration: 0.2 });
      gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0 });
      gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.15 });
    };

    // イベント委譲：MutationObserver + querySelectorAll を除去しパフォーマンス向上
    // document全体で1つのmouseover/mouseoutリスナーだけで済む
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, .trigger-btn, input, textarea")) {
        setIsHovering(true);
      }
    };
    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, .trigger-btn, input, textarea")) {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, [isTouch]);

  useEffect(() => {
    if (isTouch) return;
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
