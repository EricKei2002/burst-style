"use client";

import { useEffect, useState, useRef } from "react";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  className?: string;
  revealDirection?: "start" | "end" | "center";
  useOriginalCharsOnly?: boolean;
  characters?: string;
  animateOnHover?: boolean;
  sequential?: boolean; 
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  className = "",
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+",
  animateOnHover = false,
  sequential = false, // If true, reveal one by one. If false, scramble all then settle.
}: DecryptedTextProps) {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Definition of scramble inside useEffect or wrap in useCallback. 
    // Since it depends on many props, let's keep it here or just suppress the lint for now 
    // to match the original implementation style but cleaner.
    
    const scramble = () => {
      let iteration = 0;
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        setDisplayText((_prev) =>
          text
            .split("")
            .map((char, index) => {
              if (char === " ") return " ";
              if (index < iteration) return text[index];
              return characters[Math.floor(Math.random() * characters.length)];
            })
            .join("")
        );

        if (sequential) {
           iteration += 1 / 3;
           if (iteration >= text.length) {
               if (intervalRef.current) clearInterval(intervalRef.current);
               setDisplayText(text);
           }
        } else {
            iteration += 1 / 2;
            if (iteration >= text.length) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                setDisplayText(text);
            }
        }
      }, speed);
    };

    if (!animateOnHover) {
        scramble();
    }
    
    // We can expose scramble to mouse handlers if we move it out, 
    // but for now let's just use the effect for initial load.
    // To fix the "missing dependency" strictly we should wrap scramble in useCallback.
    // However, the logic here is slightly complex with refs. 
    
    return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, animateOnHover, speed, characters, sequential, maxIterations]); 
  
  // Re-implement hover logic cleanly
  const handleMouseEnter = () => {
    if (animateOnHover) {
        setIsHovering(true);
        // Trigger scramble... requires access to scramble function.
        // Let's force a key update or state change to re-trigger effect? 
        // Or just copy the logic. For simplicity, I'll copy logic or move it out.
        // Let's just create a new interval here.
        
        let iteration = 0;
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setDisplayText((prev) => 
                text.split("").map((char, index) => {
                    if (char === " ") return " ";
                    if (index < iteration) return text[index];
                    return characters[Math.floor(Math.random() * characters.length)];
                }).join("")
            );
            
            if (sequential) {
                iteration += 1 / 3;
            } else {
                iteration += 1 / 2;
            }
            
            if (iteration >= text.length) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                setDisplayText(text);
            }
        }, speed);
    }
  };



  const handleMouseLeave = () => {
    if (animateOnHover) {
        setIsHovering(false);
        // Optional: scramble back or just stop? usually just stop or finish.
        // We let it finish.
    }
  };

  return (
    <span 
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
    >
      {displayText}
    </span>
  );
}
