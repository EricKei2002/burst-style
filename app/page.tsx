import Top from "./components/sections/Hero";
import DeferredHomeSections from "./components/sections/DeferredHomeSections";
import { getTurnstileSiteKey } from "./lib/turnstile";

export default function Home() {
  const turnstileSiteKey = getTurnstileSiteKey();

  return (
    <div className="flex flex-col">
      <Top />
      <DeferredHomeSections turnstileSiteKey={turnstileSiteKey} />
    </div>
  );
}
