import Top from "./components/sections/Hero";
import DeferredHomeSections from "./components/sections/DeferredHomeSections";
import { getTurnstileSiteKey, looksLikeTurnstileSecretKey } from "./lib/turnstile";

// ビルド時に空だった環境変数がキャッシュされないよう、ホームは動的レンダリング
export const dynamic = "force-dynamic";

export default function Home() {
  const rawTurnstileKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const turnstileKeySwapped = looksLikeTurnstileSecretKey(rawTurnstileKey);
  const turnstileSiteKey = getTurnstileSiteKey();

  return (
    <div className="flex flex-col">
      <Top />
      <DeferredHomeSections
        turnstileSiteKey={turnstileSiteKey}
        turnstileKeySwapped={turnstileKeySwapped}
      />
    </div>
  );
}
