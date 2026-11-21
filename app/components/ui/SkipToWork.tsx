"use client";

import { useLocale } from "../../lib/locale";

/**
 * 「作品一覧へスキップ」。どのページでも常に見え、DOM の先頭近くに置く
 * （キーボードでは最初のタブで届く）。行き先は文字だけの作品一覧（#projects-index）。
 * トップでは HomeSections がクリックを受けて Projects へ切り替え、一覧にフォーカスを移す。
 * JS が無いときも通常のリンクとして動く。
 */
export default function SkipToWork() {
  const { locale } = useLocale();
  return (
    // next/link は同じパスのハッシュ移動を router で済ませてしまい、HomeSections の
    // セクション切り替え（と JS 無しの通常のアンカー）を通らないので素の <a> にする
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a href="/#projects-index" className="skip-to-work" data-sonta-avoid="">
      {locale === "ja" ? "作品一覧へスキップ" : "Skip to work index"}
    </a>
  );
}
