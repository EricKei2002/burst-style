import dynamic from "next/dynamic";
import Hero from "./components/sections/Hero";
import Projects from "./components/sections/Projects";

// スクロール後に表示されるセクションは遅延読み込み（SSRで初期HTMLは出力するが、JSを後回し）
// サーバーコンポーネントのためssr:falseは使えない
const AboutSection = dynamic(() => import("./components/sections/AboutSection"));
const ContactSection = dynamic(() => import("./components/sections/ContactSection"));
const Footer = dynamic(() => import("./components/sections/Footer"));

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
