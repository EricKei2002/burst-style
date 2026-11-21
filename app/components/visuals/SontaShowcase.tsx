"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { prefersReducedMotion } from "../../lib/pageTransitionTiming";
import type { SontaShowcaseApi } from "./SontaShowcaseCanvas";

const SontaShowcaseCanvas = dynamic(() => import("./SontaShowcaseCanvas"), {
  ssr: false,
});

type Props = {
  /** 読み込み中・失敗時・WebGL なしで見せる画像 */
  image: string;
  imageAlt: string;
  /** 操作できるときの読み上げ名 */
  actionLabel: string;
  /** 動きを減らす設定で、静止した 3D を見せるときの読み上げ名 */
  staticLabel: string;
  sizes: string;
  className: string;
};

type State = "idle" | "loading" | "ready" | "fallback";

/** Canvas の生成（WebGL コンテキスト）などで例外が出たら、画像に戻す */
class CanvasBoundary extends Component<
  { onError(): void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** 品質の段階（planetScene の detectConfig と同じ考え方）で描画ピクセル比の上限を決める */
function detectDprCap(): number {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const cores = navigator.hardwareConcurrency || 8;
  const lowEnd =
    nav.connection?.saveData === true ||
    (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) ||
    cores <= 4;
  if (lowEnd) return 1;
  const mobile =
    window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
  return Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
}

/**
 * 作品ページのヒーロー枠で Sontaくんを 3D で見せる（sonta-kun のページだけ）。
 * - 枠と画像はサーバー描画のまま（LCP・レイアウトは変わらない）。3D は枠が画面に近づいてから読み込む
 * - モデルが描けたら画像の上に重ねて見せ、読み込み中・失敗・WebGL なしでは画像のまま
 * - クリック / ホバー（マウス）/ Enter・Space でサムズアップ。動きを減らす設定では静止した姿で操作なし
 * - 画面外・タブ非表示では描画ループを止める（<div data-sonta-state> で状態を確かめられる）
 */
export default function SontaShowcase({
  image,
  imageAlt,
  actionLabel,
  staticLabel,
  sizes,
  className,
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<SontaShowcaseApi | null>(null);
  const [state, setState] = useState<State>("idle");
  const [running, setRunning] = useState(false);
  const [settings, setSettings] = useState<{
    reduced: boolean;
    dprCap: number;
  } | null>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    if (!("IntersectionObserver" in window) || !hasWebGL()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- WebGL の有無はマウント後にしか分からない
      setState("fallback");
      return;
    }
    setSettings({ reduced: prefersReducedMotion(), dprCap: detectDprCap() });
    let onScreen = false;
    let visible = !document.hidden;
    const sync = () => setRunning(onScreen && visible);
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((e) => e.isIntersecting);
        // 初めて画面に入ったら読み込みを始める（以後は描画の一時停止と再開だけ）
        if (onScreen) setState((s) => (s === "idle" ? "loading" : s));
        sync();
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(box);
    const onVis = () => {
      visible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const onReady = useCallback((api: SontaShowcaseApi) => {
    apiRef.current = api;
    setState((s) => (s === "loading" ? "ready" : s));
  }, []);
  const onError = useCallback(() => {
    apiRef.current = null;
    setState("fallback");
  }, []);

  const ready = state === "ready";
  const interactive = ready && settings !== null && !settings.reduced;
  const play = () => {
    if (interactive) apiRef.current?.thumbsUp();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      play();
    }
  };
  const onPointerEnter = (e: PointerEvent<HTMLDivElement>) => {
    if (
      e.pointerType === "mouse" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      play();
    }
  };

  return (
    <div ref={boxRef} className={className} data-sonta-state={state}>
      <Image
        src={image}
        alt={imageAlt}
        // 3D が見えている間は下の画像を読み上げない（名前は重ねた要素が持つ）
        aria-hidden={ready || undefined}
        fill
        className={`object-cover transition-opacity duration-500 motion-reduce:transition-none ${ready ? "opacity-0" : "opacity-100"}`}
        // LCP 画像: 先読みし、取得の優先度を上げる（Next 16 では priority の代わりに preload）
        preload
        fetchPriority="high"
        sizes={sizes}
      />
      {settings && (state === "loading" || state === "ready") && (
        <div
          className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${ready ? "opacity-100" : "opacity-0"}`}
        >
          <CanvasBoundary onError={onError}>
            <SontaShowcaseCanvas
              reduced={settings.reduced}
              running={running}
              dprCap={settings.dprCap}
              onReady={onReady}
              onError={onError}
            />
          </CanvasBoundary>
        </div>
      )}
      {ready &&
        (interactive ? (
          <div
            role="button"
            tabIndex={0}
            aria-label={actionLabel}
            onClick={play}
            onKeyDown={onKeyDown}
            onPointerEnter={onPointerEnter}
            // フォーカスの枠はサイト共通の :focus-visible（globals.css）。外側に 5px 出るので、
            // 枠の overflow-hidden で切れないよう 6px 内側に置く。
            // touch-pan-y：縦のスクロールはそのまま、横になぞると Sontaくんの向きが少し変わる
            className="absolute inset-1.5 cursor-pointer touch-pan-y rounded-xl"
          />
        ) : (
          <div
            role="img"
            aria-label={staticLabel}
            className="absolute inset-0"
          />
        ))}
    </div>
  );
}
