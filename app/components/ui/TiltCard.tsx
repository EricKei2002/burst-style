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

    // パフォーマンスのためのクイックセッター
    const setX = gsap.quickTo(el, "rotateX", { duration: 0.5, ease: "power2.out" });
    const setY = gsap.quickTo(el, "rotateY", { duration: 0.5, ease: "power2.out" });
    const setScale = gsap.quickTo(el, "scale", { duration: 0.5, ease: "power2.out" });

    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = el.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5; // -0.5 から 0.5
      const y = (e.clientY - top) / height - 0.5; // -0.5 から 0.5
      
      // RotateXはYの位置に対して反転する必要があります（マウスが上 -> 上向きに傾く/上を見る -> rotateXは正？ いや、rotateXが負だと上が奥に行きます）
      // 実際には標準：マウスが上 -> 上部が奥へ傾く？ それとも手前に傾く？
      // "マウスを見る"効果：マウスが上にあるとき、上部が近づく？ いや、通常はその逆です。
      // 標準的な傾きを試します：マウスが左上 -> 左上隅が下がる（奥へ行く）。
      
      setY(x * rotationIntensity * 2); // RotateYはX軸の動きに従う
      setX(-y * rotationIntensity * 2); // RotateXはY軸の動きと逆（マウスダウン -> rotateX正 -> 下が遠ざかる / 上が近づく）
      setScale(scale);
    };

    const handleMouseLeave = () => {
      setX(0);
      setY(0);
      setScale(1);
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    // 初期スタイル
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
