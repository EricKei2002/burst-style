"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const AboutSection = dynamic(() => import("./AboutSection"), { ssr: false });
const ContactSection = dynamic(() => import("./ContactSection"), { ssr: false });
const Footer = dynamic(() => import("./Footer"), { ssr: false });

export default function DeferredHomeSections() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (enabled) return;

    const activate = () => setEnabled(true);
    const onFirstScroll = () => {
      window.removeEventListener("scroll", onFirstScroll);
      activate();
    };

    window.addEventListener("scroll", onFirstScroll, { once: true, passive: true });

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(activate, { timeout: 2500 });
      return () => {
        window.cancelIdleCallback(id);
        window.removeEventListener("scroll", onFirstScroll);
      };
    }

    const timer = setTimeout(activate, 1800);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onFirstScroll);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <AboutSection />
      <ContactSection />
      <Footer />
    </>
  );
}
