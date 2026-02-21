"use client";

import { useCallback, useEffect, useState, useRef } from "react";

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
  ariaLabel?: string;
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 20,
  className = "",
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+",
  animateOnHover = false,
  sequential = false,
  ariaLabel,
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const reducedMotionRef = useRef(false);

  const clearScramble = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const runScramble = useCallback(() => {
    let iteration = 0;
    const increment = sequential ? 1 / 3 : 1 / 2;
    const hardLimit = Math.max(1, maxIterations);

    clearScramble();
    intervalRef.current = setInterval(() => {
      iteration += increment;
      setDisplayText(
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration) return text[index];
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join("")
      );

      if (iteration >= text.length || iteration >= hardLimit) {
        clearScramble();
        setDisplayText(text);
      }
    }, speed);
  }, [characters, clearScramble, maxIterations, sequential, speed, text]);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const syncTextTimer = window.setTimeout(() => {
      setDisplayText(text);
    }, 0);

    if (!animateOnHover && !reducedMotionRef.current) {
      runScramble();
    }

    return () => {
      window.clearTimeout(syncTextTimer);
      clearScramble();
    };
  }, [animateOnHover, clearScramble, runScramble, text]);

  const handleMouseEnter = () => {
    if (animateOnHover && !reducedMotionRef.current) {
      runScramble();
    }
  };

  const handleMouseLeave = () => {
    if (!animateOnHover) return;
    clearScramble();
    setDisplayText(text);
  };

  return (
    <span
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="sr-only">{ariaLabel ?? text}</span>
      <span aria-hidden="true">{displayText}</span>
    </span>
  );
}
