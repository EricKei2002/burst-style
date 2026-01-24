import AboutSection from "./components/sections/AboutSection";
import Hero from "./components/sections/Hero";
import Projects from "./components/sections/Projects";
import ContactSection from "./components/sections/ContactSection";
import Footer from "./components/sections/Footer";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Projects />
      <AboutSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
