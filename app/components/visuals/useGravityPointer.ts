import { useEffect, useRef } from "react";
import * as THREE from "three";

/** 重力レンズ用のスムーズな NDC ポインター（-1〜1） */
export function useGravityPointer() {
  const targetPointer = useRef(new THREE.Vector2(0, 0));
  const smoothPointer = useRef(new THREE.Vector2(0, 0));
  const gravity = useRef(0);
  const time = useRef(0);
  const enabled = useRef(true);

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateEnabled = () => {
      enabled.current = finePointer.matches && !reducedMotion.matches;
    };
    updateEnabled();
    finePointer.addEventListener("change", updateEnabled);
    reducedMotion.addEventListener("change", updateEnabled);

    const onPointerMove = (e: PointerEvent) => {
      if (!enabled.current) return;
      targetPointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetPointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      finePointer.removeEventListener("change", updateEnabled);
      reducedMotion.removeEventListener("change", updateEnabled);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  const tick = (delta: number, maxGravity: number) => {
    const lerpFactor = 1 - Math.exp(-12 * delta);
    smoothPointer.current.lerp(targetPointer.current, lerpFactor);
    const targetGravity = enabled.current ? maxGravity : 0;
    gravity.current = THREE.MathUtils.lerp(
      gravity.current,
      targetGravity,
      lerpFactor,
    );
    time.current += delta;
  };

  return { smoothPointer, gravity, time, tick };
}
