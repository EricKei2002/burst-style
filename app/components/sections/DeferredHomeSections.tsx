"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Projects = dynamic(() => import("./Projects"), { ssr: false });
const AboutSection = dynamic(() => import("./AboutSection"), { ssr: false });
const ContactSection = dynamic(() => import("./ContactSection"), { ssr: false });
const Footer = dynamic(() => import("./Footer"), { ssr: false });

export default function DeferredHomeSections() {
  const [enabled, setEnabled] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (enabled) return;
    const target = triggerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEnabled(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px 0px 100px 0px", threshold: 0.01 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled]);

  if (!enabled) {
    return <div ref={triggerRef} className="h-px w-full" aria-hidden="true" />;
  }

  return (
    <>
      <Projects />
      <AboutSection />
      <ContactSection />
      <Footer />
    </>
  );
}
