import Top from "./components/sections/Hero";
import DeferredHomeSections from "./components/sections/DeferredHomeSections";
import { getTurnstileSiteKey } from "./lib/turnstile";

// ビルド時に空だった環境変数がキャッシュされないよう、ホームは動的レンダリング
export const dynamic = "force-dynamic";

export default function Home() {
  const turnstileSiteKey = getTurnstileSiteKey();

  return (
    <div className="flex flex-col">
      <Top />
      <DeferredHomeSections turnstileSiteKey={turnstileSiteKey} />
    </div>
  );
}
