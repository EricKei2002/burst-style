import Top from "./components/sections/Hero";
import HomeHashScrollAlign from "./components/sections/HomeHashScrollAlign";
import NowSection from "./components/sections/NowSection";
import Projects from "./components/sections/Projects";
import AboutSection from "./components/sections/AboutSection";
import ContactSection from "./components/sections/ContactSection";
import Footer from "./components/sections/Footer";
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
      {/* 「Now Building」はサーバー描画済みなので遅延させず FV 直下に即時表示する */}
      <NowSection />
      <Projects />
      <AboutSection />
      <ContactSection
        siteKey={turnstileSiteKey}
        keySwapped={turnstileKeySwapped}
      />
      <Footer />
      <HomeHashScrollAlign />
    </div>
  );
}