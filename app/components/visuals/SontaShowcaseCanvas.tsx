"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { NoToneMapping, SRGBColorSpace } from "three";
import {
  createSontaRig,
  trackPointer,
  type SontaPointer,
  type SontaRig,
} from "./sontaRig";

export type SontaShowcaseApi = {
  thumbsUp(): boolean;
};

type Props = {
  /** 動きを減らす設定：Idle の最初の姿勢で止め、1 枚だけ描く */
  reduced: boolean;
  /** 画面内かつタブ表示中のときだけ true（false の間は描画ループを止める） */
  running: boolean;
  /** 描画ピクセル比の上限（品質の段階に合わせる） */
  dprCap: number;
  onReady(api: SontaShowcaseApi): void;
  onError(): void;
};

const LOOK_AT_Y = 0.6;
/** カメラは少し上から（仰角 5°）。モデルの前傾 6° と合わせて、ヘルメットの上面の丸みが見える */
const CAMERA_ELEVATION = (5 * Math.PI) / 180;
const CAMERA_DISTANCE = 3.3;
/**
 * モデル（高さ約 1.22）を 16:9 の枠に収めるカメラ。以前（30°・3.7）より少し寄って画角を広げ、
 * 手前の腕・アンテナと奥の体のずれ（遠近感）を少し強める
 */
const CAMERA = {
  position: [
    0,
    LOOK_AT_Y + CAMERA_DISTANCE * Math.sin(CAMERA_ELEVATION),
    CAMERA_DISTANCE * Math.cos(CAMERA_ELEVATION),
  ] as [number, number, number],
  fov: 34,
  near: 0.1,
  far: 50,
};

function SontaActor({
  reduced,
  onReady,
  onError,
}: Pick<Props, "reduced" | "onReady" | "onError">) {
  const [rig, setRig] = useState<SontaRig | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  const camera = useThree((s) => s.camera);
  const canvas = useThree((s) => s.gl.domElement);
  const readyRef = useRef(onReady);
  const errorRef = useRef(onError);
  const pointerRef = useRef<ReturnType<typeof trackPointer> | null>(null);

  // ポインター追従（動きを減らす設定では付けない）。マウスはページのどこでも、
  // タッチは枠の中で触れた・なぞったときだけ向きを少し変える
  useEffect(() => {
    if (reduced) return;
    const inside = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return (
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom
      );
    };
    const tracker = trackPointer({ acceptTouch: inside });
    pointerRef.current = tracker;
    return () => {
      tracker.dispose();
      pointerRef.current = null;
    };
  }, [reduced, canvas]);

  useEffect(() => {
    readyRef.current = onReady;
    errorRef.current = onError;
  }, [onReady, onError]);

  useEffect(() => {
    camera.lookAt(0, LOOK_AT_Y, 0);
  }, [camera]);

  useEffect(() => {
    let cancelled = false;
    let made: SontaRig | null = null;
    createSontaRig({ animate: !reduced, blink: !reduced })
      .then((r) => {
        if (cancelled) {
          r.dispose();
          return;
        }
        made = r;
        setRig(r);
      })
      .catch(() => {
        if (!cancelled) errorRef.current();
      });
    return () => {
      cancelled = true;
      made?.dispose();
    };
  }, [reduced]);

  useEffect(() => {
    if (!rig) return;
    // モデルが乗った最初のフレームを描いてから、見えるようにする
    invalidate();
    const id = requestAnimationFrame(() =>
      readyRef.current({ thumbsUp: () => rig.thumbsUp() }),
    );
    return () => cancelAnimationFrame(id);
  }, [rig, invalidate]);

  useFrame((_, delta) => {
    if (!rig) return;
    const p = pointerRef.current?.read() ?? null;
    let pointer: SontaPointer = null;
    if (p) {
      // 枠の中心を 0、枠の端を ±1 に（枠の外は頭打ち）
      const r = canvas.getBoundingClientRect();
      pointer = {
        nx: (p.x - (r.left + r.width / 2)) / Math.max(1, r.width / 2),
        ny: -(p.y - (r.top + r.height / 2)) / Math.max(1, r.height / 2),
      };
    }
    rig.update(delta, pointer);
  });

  if (!rig) return null;
  return <primitive object={rig.root} />;
}

/**
 * 作品ページ（/projects/sonta-kun）の Sontaくん。SontaShowcase から next/dynamic で読まれる。
 * - トーンマップなし（flat）・出力は sRGB。テクスチャの色空間は GLTFLoader の既定のまま
 * - 画面外・タブ非表示では frameloop="never"、動きを減らす設定では "demand"（1 枚だけ）
 * - 操作は外側の role="button" が受け持つので、Canvas はポインターを受けない
 */
export default function SontaShowcaseCanvas({
  reduced,
  running,
  dprCap,
  onReady,
  onError,
}: Props) {
  return (
    <Canvas
      flat
      camera={CAMERA}
      dpr={[1, dprCap]}
      frameloop={reduced ? "demand" : running ? "always" : "never"}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = NoToneMapping;
        gl.outputColorSpace = SRGBColorSpace;
        gl.setClearColor(0x000000, 0);
      }}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <SontaActor reduced={reduced} onReady={onReady} onError={onError} />
    </Canvas>
  );
}
