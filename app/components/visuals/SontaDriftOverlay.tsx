"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { NoToneMapping, SRGBColorSpace, type Group } from "three";
import { HOME_SECTION_EVENT } from "../../lib/homeSections";
import { prefersReducedMotion } from "../../lib/pageTransitionTiming";
import {
  SONTA_OVERLAY_FOV_DEG,
  SONTA_OVERLAY_FRAME,
  sontaOverlayBox,
  sontaOverlayCameraDistance,
  sontaOverlayWobble,
  sontaVisibleViewport,
  type ScreenRect,
  type SontaOverlayBox,
} from "../../lib/sontaMotion";
import CanvasBoundary from "./CanvasBoundary";
import { createSontaRig, type SontaRig } from "./sontaRig";

/** タブ復帰などで時間が飛ばないようにする上限（秒） */
const MAX_DT_S = 0.1;
/** 障害物の位置を測り直す間隔（ms）。あとから出る計器表示・フォント・アドレスバーの伸縮に追従する */
const REMEASURE_MS = 1500;
/** セクション切り替えのアニメーション（0.2 秒）が終わってから測り直す */
const SECTION_SETTLE_MS = 350;
/** 描画ピクセル比の上限。2 を超えても、この大きさの絵ではほとんど差が出ない */
const MAX_DPR = 2;

/** 固定・張り付き（sticky）配置の要素（またはその中）は、スクロール 0 のときと同じ位置に居続ける */
function isInFixed(el: HTMLElement): boolean {
  for (let n: HTMLElement | null = el; n; n = n.parentElement) {
    const position = getComputedStyle(n).position;
    if (position === "fixed" || position === "sticky") return true;
  }
  return false;
}

/** 避ける対象（[data-sonta-avoid]）の矩形を、スクロール 0 のときの画面の座標で集める */
function measureObstacles(): ScreenRect[] {
  const out: ScreenRect[] = [];
  document.querySelectorAll<HTMLElement>("[data-sonta-avoid]").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    const dy = isInFixed(el) ? 0 : window.scrollY;
    out.push({
      left: r.left,
      right: r.right,
      top: r.top + dy,
      bottom: r.bottom + dy,
    });
  });
  return out;
}

function sameBox(a: SontaOverlayBox | null, b: SontaOverlayBox | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.left === b.left &&
    a.top === b.top &&
    a.width === b.width &&
    a.height === b.height
  );
}

function SontaActor({ reduced }: { reduced: boolean }) {
  const groupRef = useRef<Group>(null);
  const [rig, setRig] = useState<SontaRig | null>(null);
  const elapsed = useRef(0);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);

  // 枠の中心を光軸に合わせる（画面の端の透視の歪みが出ない）
  useEffect(() => {
    const d = sontaOverlayCameraDistance(size.width / Math.max(1, size.height));
    camera.position.set(SONTA_OVERLAY_FRAME.cx, SONTA_OVERLAY_FRAME.cy, d);
    camera.lookAt(SONTA_OVERLAY_FRAME.cx, SONTA_OVERLAY_FRAME.cy, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, invalidate]);

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
        root.dataset.sontaDriftMode = "overlay";
        invalidate();
      })
      .catch(() => {
        // 読めなければ出さない
      });
    return () => {
      cancelled = true;
      made?.dispose();
      delete root.dataset.sontaDrift;
      delete root.dataset.sontaDriftMode;
    };
  }, [reduced, invalidate]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!rig || !group) return;
    const dt = Math.min(Math.max(delta, 0), MAX_DT_S);
    elapsed.current += dt;
    // ポインター追従はしない（スマホ。向きは自動のスイングだけ）
    rig.update(dt, null);
    const w = sontaOverlayWobble(elapsed.current, reduced);
    group.position.set(0, w.bobY, 0);
    group.rotation.set(w.rotX, 0, w.rotZ);
    group.visible = true;
  });

  if (!rig) return null;
  return (
    <group ref={groupRef} visible={false}>
      <primitive object={rig.root} />
    </group>
  );
}

/**
 * スマホ（幅 768 未満）のトップで漂う Sontaくん。星空の Canvas の外に置く専用の小さな Canvas。
 * - 星空（.star-bg）の減光・もや・色かぶりを受けない（z-index は veil・haze・雨・雪の上、本文の下）
 * - 描画は dpr 最大 2・アンチエイリアスあり・画角 12°（体の中心を光軸に合わせる）
 * - 位置と大きさは、ヘッダー・本文のカード・「My Skills」・Skip の予約枠（既定の位置）・ボトムナビ・計器表示（[data-sonta-avoid]）の
 *   実際の矩形から sontaOverlayBox が決める（見えている画面の中だけで探す）。小さい画面では縮めて
 *   空いている場所に入れ、最小の高さ（SONTA_OVERLAY_SMALL_MIN_H）も入らなければ何も出さない
 * - 操作は受けない（pointer-events:none・aria-hidden・レイキャスト対象外）
 * - 動きを減らす設定：揺れず・振らず、斜め 27° で 1 枚だけ描く
 * - <html data-sonta-drift="running|static" data-sonta-drift-mode="overlay"> で状態を確かめられる
 */
export default function SontaDriftOverlay() {
  const [reduced] = useState(prefersReducedMotion);
  const [dpr] = useState(() =>
    Math.min(Math.max(window.devicePixelRatio || 1, 1), MAX_DPR),
  );
  const [box, setBox] = useState<SontaOverlayBox | null>(null);
  const [hidden, setHidden] = useState(() => document.hidden);

  useEffect(() => {
    let frame = 0;
    let settle = 0;
    const measure = () => {
      frame = 0;
      // 横にはみ出すページでは innerWidth が見える範囲より広いので、見える範囲の中だけで探す
      const de = document.documentElement;
      const next = sontaOverlayBox(
        sontaVisibleViewport(
          { width: window.innerWidth, height: window.innerHeight },
          { width: de.clientWidth, height: de.clientHeight },
        ),
        measureObstacles(),
      );
      setBox((prev) => (sameBox(prev, next) ? prev : next));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const onSection = () => {
      schedule();
      window.clearTimeout(settle);
      settle = window.setTimeout(schedule, SECTION_SETTLE_MS);
    };
    const onVisibility = () => setHidden(document.hidden);

    schedule();
    const timer = window.setInterval(schedule, REMEASURE_MS);
    void document.fonts?.ready.then(schedule);
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    window.addEventListener(HOME_SECTION_EVENT, onSection);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.clearInterval(timer);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      window.removeEventListener(HOME_SECTION_EVENT, onSection);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  if (!box) return null;
  return (
    <div
      className="sonta-overlay"
      aria-hidden="true"
      style={{
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
      }}
    >
      <CanvasBoundary>
        <Canvas
          flat
          camera={{
            fov: SONTA_OVERLAY_FOV_DEG,
            near: 0.1,
            far: 20,
            position: [SONTA_OVERLAY_FRAME.cx, SONTA_OVERLAY_FRAME.cy, 3.1],
          }}
          dpr={dpr}
          frameloop={reduced ? "demand" : hidden ? "never" : "always"}
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
        >
          <SontaActor reduced={reduced} />
        </Canvas>
      </CanvasBoundary>
    </div>
  );
}
