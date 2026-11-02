"use client";

import { useLocale } from "../../lib/locale";

/** 404ページ用: 現在の表示言語に合わせて文言を切り替える */
export default function NotFoundText({ en, ja }: { en: string; ja: string }) {
  const { locale } = useLocale();
  return locale === "ja" ? ja : en;
}
