"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, PerspectiveCamera } from "three";
import { prefersReducedMotion } from "../../lib/pageTransitionTiming";
import { SONTA_MODEL_HEIGHT, sontaDriftPose } from "../../lib/sontaMotion";
import { createSontaRig, trackPointer, type SontaRig } from "./sontaRig";

/** カメラからの距離。太陽・月（奥 20〜50）より手前、星の層の中ほど */
const DEPTH = 10;
/** タブ復帰などで時間が飛ばないようにする上限（秒） */
const MAX_DT_S = 0.1;
/** ポインター追従：Sontaくんからこの距離（正規化座標）離れると、向ける角度が上限になる */
const POINTER_REACH_NDC = 0.8;

/**
 * トップ（Home セクション）の宇宙背景を、Sontaくんがゆっくり漂う。
 * StarBackground の Canvas（既存の WebGL コンテキスト）の中に React.lazy で読まれる。
 * - 位置・上下の揺れは sontaDriftPose（右の余白／スマホは下の角。本文の中央は避ける）
 * - 向きは作品ページと同じ（斜め 3/4＋左右のスイング＋マウスの方を向く。sontaRig / sontaMotion）
 * - Idle を流し、ときどき瞬き。材質は toneMapped=false（ACES の影響を受けず GLB の色のまま）
 * - 動きを減らす設定：漂わず・振らず・追わず、Idle の最初の姿勢・斜め 3/4 の向きで静止させる
 * - 背景なので操作は受けない（レイキャスト対象外。親の div は aria-hidden）
 * - <html data-sonta-drift="running|static"> で状態を確かめられる
 */
export default function SontaDrift() {
  const groupRef = useRef<Group>(null);
  const spinRef = useRef<Group>(null);
  const [rig, setRig] = useState<SontaRig | null>(null);
  const [reduced] = useState(prefersReducedMotion);
  const elapsed = useRef(0);
  const pointerRef = useRef<ReturnType<typeof trackPointer> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let made: SontaRig | null = null;
    const root = document.documentElement;
    createSontaRig({ animate: !reduced, blink: !reduced })
      .then((r) => {
        if (cancelled) {
          r.dispose();
          return;
        }
        // 背景の飾りなので、クリックやホバーの当たり判定から外す
        r.root.traverse((o) => {
          o.raycast = () => {};
        });
        made = r;
        setRig(r);
        root.dataset.sontaDrift = reduced ? "static" : "running";
      })
      .catch(() => {
        // 読めなければ出さない（背景はそのまま）
      });
    return () => {
      cancelled = true;
      made?.dispose();
      delete root.dataset.sontaDrift;
    };
  }, [reduced]);

  // ポインター追従（マウス・ペンだけ。タッチ端末は自動のスイングのみ）。背景は
  // pointer-events:none のままにし、window の passive なリスナーで位置だけ ref に持つ
  useEffect(() => {
    if (reduced) return;
    const tracker = trackPointer({});
    pointerRef.current = tracker;
    return () => {
      tracker.dispose();
      pointerRef.current = null;
    };
  }, [reduced]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!rig || !group) return;
    const dt = Math.min(Math.max(delta, 0), MAX_DT_S);
    elapsed.current += dt;

    const camera = state.camera as PerspectiveCamera;
    const aspect = state.size.width / Math.max(1, state.size.height);
    const pose = sontaDriftPose(elapsed.current, aspect, reduced);

    // Sontaくんの画面上の位置を中心に、ポインターまでのずれ（画面の 0.8 ぶんで頭打ち）
    const p = pointerRef.current?.read() ?? null;
    rig.update(
      dt,
      p && {
        nx:
          ((p.x / Math.max(1, state.size.width)) * 2 - 1 - pose.ndcX) /
          POINTER_REACH_NDC,
        ny:
          (1 - (p.y / Math.max(1, state.size.height)) * 2 - pose.ndcY) /
          POINTER_REACH_NDC,
      },
    );

    const halfH = DEPTH * Math.tan(((camera.fov ?? 75) * Math.PI) / 360);
    const worldH = halfH * 2 * pose.heightFrac;
    const x = pose.ndcX * halfH * aspect;
    const y = pose.ndcY * halfH;
    const s = worldH / SONTA_MODEL_HEIGHT;
    // 画角 75° の端では丸い体が外側へ引き伸ばされて見えるので、視線の角度ぶん縮めて打ち消す
    group.scale.set(
      s * Math.cos(Math.atan(x / DEPTH)),
      s * Math.cos(Math.atan(y / DEPTH)),
      s,
    );
    group.position.set(
      camera.position.x + x,
      camera.position.y + y - worldH / 2,
      camera.position.z - DEPTH,
    );
    if (spinRef.current) {
      // 画面の端・上下にいても正面がカメラを向くよう、視線の角度を足す。
      // 斜め 3/4・スイング・追従の向きは、この内側で rig.update が root に当てる
      spinRef.current.rotation.set(
        Math.atan2(y, DEPTH) + pose.rotX,
        Math.atan2(-x, DEPTH),
        pose.rotZ,
      );
    }
    group.visible = true;
  });

  if (!rig) return null;
  return (
    // 位置が決まる最初のフレームまでは隠す。外側＝位置と見え方の補正、内側＝向き
    <group ref={groupRef} visible={false}>
      <group ref={spinRef}>
        <primitive object={rig.root} />
      </group>
    </group>
  );
}
