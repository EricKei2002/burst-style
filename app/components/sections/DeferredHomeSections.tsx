"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Projects = dynamic(() => import("./Projects"), { ssr: false });
const AboutSection = dynamic(() => import("./AboutSection"), { ssr: false });
const ContactSection = dynamic(() => import("./ContactSection"), { ssr: false });
const Footer = dynamic(() => import("./Footer"), { ssr: false });

export default function DeferredHomeSections({
  turnstileSiteKey,
  turnstileKeySwapped,
}: {
  turnstileSiteKey: string;
  turnstileKeySwapped: boolean;
}) {
  const [enabled, setEnabled] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (enabled) return;

    const activate = () => setEnabled(true);

    const target = triggerRef.current;
    let observer: IntersectionObserver | undefined;

    if (target) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) activate();
        },
        { rootMargin: "400px 0px 400px 0px", threshold: 0 },
      );
      observer.observe(target);
    }

    const onScroll = () => {
      const y =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop;
      if (y > window.innerHeight * 0.25) activate();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const onWheel = () => activate();
    window.addEventListener("wheel", onWheel, { once: true, passive: true });
    window.addEventListener("touchmove", onWheel, { once: true, passive: true });

    let idleId: number | undefined;
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(activate, { timeout: 700 });
    }
    const fallback = setTimeout(activate, 900);

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onWheel);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      clearTimeout(fallback);
    };
  }, [enabled]);

  if (!enabled) {
    return (
      <div
        ref={triggerRef}
        className="h-px w-full shrink-0"
        aria-hidden="true"
      />
    );
  }

  return (
    <>
      <Projects />
      <AboutSection />
      <ContactSection
        siteKey={turnstileSiteKey}
        keySwapped={turnstileKeySwapped}
      />
      <Footer />
    </>
  );
}
