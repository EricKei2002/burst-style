import Top from "./components/sections/Hero";
import dynamic from "next/dynamic";
import DeferredHomeSections from "./components/sections/DeferredHomeSections";

// コード分割でJSバンドルを軽量化
const Projects = dynamic(() => import("./components/sections/Projects"));

export default function Home() {
  return (
    <div className="flex flex-col">
      <Top />
      <Projects />
      <DeferredHomeSections />
    </div>
  );
}
