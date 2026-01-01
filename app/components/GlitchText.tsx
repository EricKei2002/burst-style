"use client";

import styles from "./GlitchText.module.css";

interface GlitchTextProps {
  text: string;
  className?: string;
}

export default function GlitchText({ text, className = "" }: GlitchTextProps) {
  return (
    <span className={`${styles.glitch} ${className}`} data-text={text}>
      {text}
    </span>
  );
}
