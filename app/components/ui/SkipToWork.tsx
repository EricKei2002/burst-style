"use client";

import { useLocale } from "../../lib/locale";

/**
 * 「作品一覧へスキップ」。どのページでも常に見え、DOM の先頭近くに置く
 * （キーボードでは最初のタブで届く）。行き先は文字だけの作品一覧（#projects-index）。
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
