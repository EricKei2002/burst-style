"use client";

import {
  rgbCss,
  type PlanetBackdrop,
  type PlanetTheme,
} from "../../lib/planets";

type Props = {
  theme: PlanetTheme;
  backdrop: PlanetBackdrop;
};

/** 縦長の画面（スマホ・縦置きタブレット）には縦長の画像を出す */
const TALL = "(max-aspect-ratio: 4/5)";

/**
 * 惑星ページの背景。Blender で事前レンダリングした静止画（scripts/blender/）を敷く。
 * 3D も常時の描画も無いので、WebGL が無効でも「視差効果を減らす」設定でも同じ見た目になる。
 * 画像の読み込み中・失敗時は、下の CSS グラデーション（空と地平）が見える。
 */
export default function PlanetInterior({ theme, backdrop }: Props) {
  const src = (variant: "wide" | "tall", format: "avif" | "webp") =>
    `/backgrounds/${backdrop}-${variant}.${format}`;

  return (
    <div
      aria-hidden="true"
      data-planet-backdrop={backdrop}
      // h-lvh: スマホでアドレスバーが出入りしても画像が伸び縮みしない
      className="pointer-events-none fixed inset-x-0 top-0 -z-50 h-lvh overflow-hidden"
      style={{
        backgroundColor: rgbCss(theme.skyTop),
        backgroundImage: `linear-gradient(to bottom, ${rgbCss(theme.skyTop)} 0%, ${rgbCss(theme.skyHorizon)} 44%, ${rgbCss(theme.groundHi)} 48%, ${rgbCss(theme.ground)} 100%)`,
      }}
    >
      {/* key: 惑星を移るとき、前の画像を残さず作り直す */}
      <picture key={backdrop}>
        <source media={TALL} type="image/avif" srcSet={src("tall", "avif")} />
        <source media={TALL} type="image/webp" srcSet={src("tall", "webp")} />
        <source type="image/avif" srcSet={src("wide", "avif")} />
        {/* 書き出し済みの AVIF / WebP をそのまま配る（next/image で再圧縮しない） */}
        <img
          src={src("wide", "webp")}
          alt=""
          decoding="async"
          // 本文の画像（作品詳細のヒーローなど）より後でよい
          fetchPriority="low"
          className="h-full w-full object-cover"
        />
      </picture>
    </div>
  );
}
