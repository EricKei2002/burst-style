import AboutSection from "./components/AboutSection";
import Hero from "./components/Hero";
import Projects from "./components/Projects";

export default function Home() {
  return (
    <div className="space-y-16">
      <Hero />
      <Projects />
      <AboutSection />
    </div>
  );
}
