"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import SpaceWarpField from "./SpaceWarpField";
import { useGravityPointer } from "./useGravityPointer";
import WarpStars from "./WarpStarsPoints";

export default function StarfieldGravity({
  count,
  strength,
}: {
  count: number;
  strength: number;
}) {
  const pointer = useGravityPointer();
  const strengthRef = useRef(strength);
  strengthRef.current = strength;

  useFrame((_, delta) => {
    pointer.tick(delta, strengthRef.current);
  });

  return (
    <>
      <SpaceWarpField pointer={pointer} />
      <WarpStars pointer={pointer} count={count} />
    </>
  );
}
