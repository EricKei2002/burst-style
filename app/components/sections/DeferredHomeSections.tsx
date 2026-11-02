"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Projects = dynamic(() => import("./Projects"), { ssr: false });
const AboutSection = dynamic(() => import("./AboutSection"), { ssr: false });
const ContactSection = dynamic(() => import("./ContactSection"), {
  ssr: false,
});
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
    window.addEventListener("touchmove", onWheel, {
      once: true,
      passive: true,
    });

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

  // ハッシュ付き URL（/#now, /#about など）で開いたとき、初回ロード時点では後続セクションが
  // 未マウントでページ高が足りず、目的の位置までスクロールできない。マウント後しばらくは
  // レイアウトの伸びに合わせてハッシュ先へ位置を合わせ直す（ユーザーが操作したら即中止）
  useEffect(() => {
    if (!enabled) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;

    let stopped = false;
    const align = () => {
      if (stopped) return;
      document.getElementById(id)?.scrollIntoView({ block: "start" });
    };
    const resizeObserver = new ResizeObserver(align);
    resizeObserver.observe(document.body);

    const stop = () => {
      stopped = true;
      resizeObserver.disconnect();
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
      clearTimeout(timer);
    };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);
    const timer = setTimeout(stop, 2500);

    return stop;
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
