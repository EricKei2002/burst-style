import Top from "./components/sections/Hero";
import DeferredHomeSections from "./components/sections/DeferredHomeSections";
import NowSection from "./components/sections/NowSection";
import {
  getTurnstileSiteKey,
  looksLikeTurnstileSecretKey,
} from "./lib/turnstile";

// 「今作っているもの」の GitHub データに合わせて10分ごとに再生成する（ISR）
export const revalidate = 600;

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
        nowSection={<NowSection />}
      />
    </div>
  );
}
