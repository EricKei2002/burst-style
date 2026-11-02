import Top from "./components/sections/Hero";
import DeferredHomeSections from "./components/sections/DeferredHomeSections";
import NowSection from "./components/sections/NowSection";
import {
  getTurnstileSiteKey,
  looksLikeTurnstileSecretKey,
} from "./lib/turnstile";

// 「Now Building」の GitHub データに合わせて10分ごとに再生成する（ISR）
export const revalidate = 600;

export default function Home() {
  const rawTurnstileKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  const turnstileKeySwapped = looksLikeTurnstileSecretKey(rawTurnstileKey);
  const turnstileSiteKey = getTurnstileSiteKey();

  return (
    <div className="flex flex-col">
      <Top />
      {/* 「Now Building」はサーバー描画済みなので遅延させず FV 直下に即時表示する。
          後続セクションが遅延マウントされても、このセクションの位置は動かない */}
      <NowSection />
      <DeferredHomeSections
        turnstileSiteKey={turnstileSiteKey}
        turnstileKeySwapped={turnstileKeySwapped}
      />
    </div>
  );
}
