import Top from "./components/sections/Hero";
import DeferredHomeSections from "./components/sections/DeferredHomeSections";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Top />
      <DeferredHomeSections />
    </div>
  );
}
