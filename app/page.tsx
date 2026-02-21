import Hero from "./components/sections/Hero";
import Projects from "./components/sections/Projects";
import DeferredHomeSections from "./components/sections/DeferredHomeSections";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Projects />
      <DeferredHomeSections />
    </div>
  );
}
