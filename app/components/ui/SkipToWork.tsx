"use client";

import { useLocale } from "../../lib/locale";

/**
 * 「作品一覧へスキップ」。DOM の先頭に置き、キーボードでは最初の Tab で届く。
 * 行き先は文字だけの作品一覧（#projects-index）。
 * - 640px 以上と、トップ以外（作品詳細・404）では画面上端に吊るして常に見せる
 * - スマホのトップでは、スクロール中の本文に重ならないようフォーカスされるまで視覚的に隠し
 *   （clip / clip-path。globals.css の .skip-to-work）、フォーカス時だけ下部タブの直上に出す。
 *   タッチで「いつでも」届く入口は、下部タブ（と sm 以上のヘッダーメニュー）の /Index（/一覧）が担う
 * トップでは HomeSections がクリックを受けて Projects へ切り替え、一覧にフォーカスを移す。
 * JS が無いときも通常のリンクとして動く。
 *
 * そんたくんが避けるのは、見えるリンクではなく「予約枠」（同じ見た目・同じ位置の見えない span）。
 * 小さい画面では見えるリンクだけが、他の要素と重ならない位置へずれる（globals.css）。
 * 予約枠は常に既定の位置にあるので、そんたくんの枠はリンクの移動に影響されない。
 * 予約枠は aria-hidden・visibility:hidden・pointer-events:none で、読み上げ・フォーカス・タップの対象にならない
 * （リンクが DOM の先頭側にあり、最初のタブで届く）。
 */
export default function SkipToWork() {
  const { locale } = useLocale();
  const label = locale === "ja" ? "作品一覧へスキップ" : "Skip to work index";
  return (
    <>
      {/* next/link は同じパスのハッシュ移動を router で済ませてしまい、HomeSections の
          セクション切り替え（と JS 無しの通常のアンカー）を通らないので素の <a> にする */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/#projects-index" className="skip-to-work">
        {label}
      </a>
      <span
        className="skip-to-work skip-to-work-slot"
        aria-hidden="true"
        data-sonta-avoid=""
      >
        {label}
      </span>
    </>
  );
}
