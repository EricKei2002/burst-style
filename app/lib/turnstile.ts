/** Cloudflare のシークレットキーがサイトキー欄に入っているかの簡易判定 */
export function looksLikeTurnstileSecretKey(key: string): boolean {
  const k = key.trim();
  return k.length > 35 || k.includes("_");
}

/** Server / build-time: read Turnstile site key from env. */
export function getTurnstileSiteKey(): string {
  const raw = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  if (looksLikeTurnstileSecretKey(raw)) return "";
  return raw;
}
