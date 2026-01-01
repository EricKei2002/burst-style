import AboutSection from "./components/AboutSection";
import Hero from "./components/Hero";
import Projects from "./components/Projects";
import ContactSection from "./components/ContactSection";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Projects />
      <AboutSection />
      <ContactSection />
    </div>
  );
}
