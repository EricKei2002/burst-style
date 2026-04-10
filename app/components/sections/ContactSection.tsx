"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import DecryptedText from "../ui/DecryptedText";
import MagneticButton from "../ui/MagneticButton";
import TiltCard from "../ui/TiltCard";
import { useLocale, useSiteCopy } from "../../lib/locale";

const Turnstile = dynamic(
  () => import("@marsidev/react-turnstile").then((mod) => mod.Turnstile),
  { ssr: false },
);

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
const NEEDS_TURNSTILE = TURNSTILE_SITE_KEY.length > 0;

export default function ContactSection() {
  const { locale } = useLocale();
  const copy = useSiteCopy();
  const sectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isTurnstileReady, setIsTurnstileReady] = useState(false);

  useEffect(() => {
    const target = sectionRef.current;
    if (!target) return;

    let rafId = 0;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      rafId = requestAnimationFrame(() => {
        setIsVisible(true);
        if (!NEEDS_TURNSTILE) setIsTurnstileReady(true);
      });
    } else if (!NEEDS_TURNSTILE) {
      rafId = requestAnimationFrame(() => setIsTurnstileReady(true));
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (NEEDS_TURNSTILE) setIsTurnstileReady(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(target);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (NEEDS_TURNSTILE && !turnstileToken) {
      setErrorMessage(copy.contact.errTurnstile);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      if (NEEDS_TURNSTILE && turnstileToken) {
        formData.append("cf-turnstile-response", turnstileToken);
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setIsSent(true);
        if (formRef.current) formRef.current.reset();
        setTurnstileToken(null);
        setTimeout(() => setIsSent(false), 10000);
      } else {
        console.error("Submission failed");
        setErrorMessage(copy.contact.errTransmit);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setErrorMessage(copy.contact.errConnection);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative w-full py-24 sm:py-32 overflow-clip"
    >
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div
          className={`mb-16 max-w-2xl transition-all duration-700 ease-out ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <div className="flex items-center gap-2 text-fuchsia-300 mb-4">
            <span className="h-px w-8 bg-current" />
            <span className="font-mono text-xs tracking-wider uppercase">
              06. Contact
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
            <DecryptedText text="Get In Touch" animateOnHover speed={30} />
          </h2>
          <p className="text-zinc-200 leading-relaxed">
            {copy.contact.leadLine1}
            <br />
            {copy.contact.leadLine2}
          </p>
        </div>

        <div
          className={`relative mx-auto max-w-3xl transition-all duration-700 ease-out ${
            isVisible
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-10 scale-[0.98] opacity-0"
          }`}
        >
          <TiltCard rotationIntensity={2} className="w-full">
            <div className="relative w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 sm:p-12 overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <div className="w-16 h-16 border-t border-r border-fuchsia-500 rounded-tr-xl" />
              </div>
              <div className="absolute bottom-0 left-0 p-4 opacity-20">
                <div className="w-16 h-16 border-b border-l border-fuchsia-500 rounded-bl-xl" />
              </div>

              {!isSent ? (
                <form
                  ref={formRef}
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-6"
                >
                  <input type="hidden" name="locale" value={locale} />
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="name"
                        className="text-xs font-mono text-fuchsia-300 ml-1"
                      >
                        <DecryptedText
                          key={`name-${locale}`}
                          text={copy.contact.formName}
                          animateOnHover
                          speed={20}
                        />
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-sans"
                        placeholder={copy.contact.placeholderName}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="text-xs font-mono text-fuchsia-300 ml-1"
                      >
                        <DecryptedText
                          key={`email-${locale}`}
                          text={copy.contact.formEmail}
                          animateOnHover
                          speed={20}
                        />
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-sans"
                        placeholder={copy.contact.placeholderEmail}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="message"
                      className="text-xs font-mono text-fuchsia-300 ml-1"
                    >
                      <DecryptedText
                        key={`msg-${locale}`}
                        text={copy.contact.formMessage}
                        animateOnHover
                        speed={20}
                      />
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all resize-none font-sans"
                      placeholder={copy.contact.placeholderMessage}
                    />
                  </div>

                  <div className="flex flex-col items-center gap-4 pt-2">
                    {NEEDS_TURNSTILE ? (
                      isTurnstileReady ? (
                        <Turnstile
                          siteKey={TURNSTILE_SITE_KEY}
                          onSuccess={setTurnstileToken}
                          onExpire={() => setTurnstileToken(null)}
                          onError={() => setTurnstileToken(null)}
                          options={{
                            theme: "dark",
                            action: "contact-form",
                          }}
                        />
                      ) : (
                        <div className="rounded-lg border border-zinc-700 bg-zinc-950/40 px-4 py-3 font-mono text-xs text-zinc-200">
                          {copy.contact.securityLoading}
                        </div>
                      )
                    ) : (
                      <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/40 px-4 py-3 text-center font-mono text-xs text-zinc-400">
                        {copy.contact.turnstileDisabled}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-4 pt-4">
                    {errorMessage && (
                      <p className="font-mono text-xs text-red-300 tracking-wider animate-pulse">
                        &gt; {errorMessage}
                      </p>
                    )}
                    <MagneticButton strength={0.3} className="inline-block">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="relative overflow-hidden group bg-zinc-100 text-zinc-950 px-8 py-3 rounded-full font-bold tracking-wide transition-all hover:bg-fuchsia-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          {isSubmitting
                            ? copy.contact.sending
                            : copy.contact.send}
                          {!isSubmitting && (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="transform transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                            >
                              <line x1="7" y1="17" x2="17" y2="7" />
                              <polyline points="7 7 17 7 17 17" />
                            </svg>
                          )}
                        </span>
                      </button>
                    </MagneticButton>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-500">
                  <div className="w-16 h-16 bg-fuchsia-500/30 text-fuchsia-200 rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                    {copy.contact.successTitle}
                  </h3>
                  <p className="text-zinc-200 max-w-md leading-relaxed">
                    {copy.contact.successBody1}
                    <br />
                    {copy.contact.successBody2}
                    <br />
                    {copy.contact.successBody3}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSent(false)}
                    className="mt-8 text-sm text-fuchsia-300 hover:text-fuchsia-200 underline underline-offset-4 font-mono uppercase tracking-wider"
                  >
                    {copy.contact.sendAnother}
                  </button>
                </div>
              )}
            </div>
          </TiltCard>
        </div>
      </div>
    </section>
  );
}
