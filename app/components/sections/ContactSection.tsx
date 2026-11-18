"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import DecryptedText from "../ui/DecryptedText";
import MagneticButton from "../ui/MagneticButton";
import { sectionPageLabel } from "../../lib/homeSections";
import { useLocale, useSiteCopy } from "../../lib/locale";

const Turnstile = dynamic(
  () => import("@marsidev/react-turnstile").then((mod) => mod.Turnstile),
  { ssr: false },
);

type ContactField = "name" | "email" | "message";

type ContactApiBody = {
  success?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<ContactField, string>>;
};

type ContactSectionProps = {
  siteKey: string;
  keySwapped?: boolean;
};

export default function ContactSection({
  siteKey,
  keySwapped = false,
}: ContactSectionProps) {
  const rawSiteKey = siteKey.trim();
  const needsTurnstile = rawSiteKey.length > 0 && !keySwapped;
  const { locale } = useLocale();
  const copy = useSiteCopy();
  const formRef = useRef<HTMLFormElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ContactField, string>>
  >({});
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);

  // 送信に成功したらフォームが消えるので、結果の見出しへフォーカスを移す
  useEffect(() => {
    if (isSent) successHeadingRef.current?.focus();
  }, [isSent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (needsTurnstile && !turnstileToken) {
      setErrorMessage(copy.contact.errTurnstile);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setFieldErrors({});

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      if (needsTurnstile && turnstileToken) {
        formData.append("cf-turnstile-response", turnstileToken);
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });

      let body: ContactApiBody | null = null;
      try {
        body = (await response.json()) as ContactApiBody;
      } catch {
        body = null;
      }

      if (response.ok && body?.success === true) {
        setIsSent(true);
        if (formRef.current) formRef.current.reset();
        setTurnstileToken(null);
        setTimeout(() => setIsSent(false), 10000);
      } else if (response.status === 400 && body?.fieldErrors) {
        setFieldErrors(body.fieldErrors);
        setErrorMessage(body.error ?? copy.contact.errTransmit);
      } else {
        console.error("Submission failed", response.status, body);
        setErrorMessage(body?.error ?? copy.contact.errTransmit);
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
      className="relative w-full py-24 sm:py-32 overflow-clip"
    >
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="instrument-panel mb-16 max-w-2xl p-6">
          <p className="instrument-label mb-4 text-sm">
            <span aria-hidden="true">[{sectionPageLabel("contact")}] </span>
            ~/contact
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
            <DecryptedText text="Get In Touch" animateOnHover speed={30} />
          </h2>
          <p className="text-zinc-200 leading-relaxed">
            {copy.contact.leadLine1}
            <br className="hidden sm:block" />
            {copy.contact.leadLine2}
          </p>
        </div>

        <div className="relative mx-auto max-w-3xl">
          <div className="relative w-full rounded-2xl border border-zinc-800 bg-[rgb(7_7_11/0.95)] p-8 sm:p-12 overflow-hidden">
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
                      {copy.contact.formName}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      autoComplete="name"
                      required
                      aria-invalid={fieldErrors.name ? true : undefined}
                      aria-describedby={
                        fieldErrors.name ? "name-error" : undefined
                      }
                      className={`w-full bg-zinc-950/70 border rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus-visible:ring-2 transition-[border-color,box-shadow] duration-150 font-sans ${
                        fieldErrors.name
                          ? "border-red-500/60 focus:border-red-500/60 focus:ring-red-500/40 focus-visible:ring-red-300"
                          : "border-zinc-600 focus:border-fuchsia-500/50 focus:ring-fuchsia-500/50 focus-visible:ring-fuchsia-300"
                      }`}
                      placeholder={copy.contact.placeholderName}
                    />
                    {fieldErrors.name ? (
                      <p
                        id="name-error"
                        className="font-mono text-xs text-red-300/90 ml-1"
                      >
                        {fieldErrors.name}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-xs font-mono text-fuchsia-300 ml-1"
                    >
                      {copy.contact.formEmail}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      autoComplete="email"
                      required
                      aria-invalid={fieldErrors.email ? true : undefined}
                      aria-describedby={
                        fieldErrors.email ? "email-error" : undefined
                      }
                      className={`w-full bg-zinc-950/70 border rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus-visible:ring-2 transition-[border-color,box-shadow] duration-150 font-sans ${
                        fieldErrors.email
                          ? "border-red-500/60 focus:border-red-500/60 focus:ring-red-500/40 focus-visible:ring-red-300"
                          : "border-zinc-600 focus:border-fuchsia-500/50 focus:ring-fuchsia-500/50 focus-visible:ring-fuchsia-300"
                      }`}
                      placeholder={copy.contact.placeholderEmail}
                    />
                    {fieldErrors.email ? (
                      <p
                        id="email-error"
                        className="font-mono text-xs text-red-300/90 ml-1"
                      >
                        {fieldErrors.email}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="message"
                    className="text-xs font-mono text-fuchsia-300 ml-1"
                  >
                    {copy.contact.formMessage}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    aria-invalid={fieldErrors.message ? true : undefined}
                    aria-describedby={
                      fieldErrors.message ? "message-error" : undefined
                    }
                    className={`w-full bg-zinc-950/70 border rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus-visible:ring-2 transition-[border-color,box-shadow] duration-150 resize-none font-sans ${
                      fieldErrors.message
                        ? "border-red-500/60 focus:border-red-500/60 focus:ring-red-500/40 focus-visible:ring-red-300"
                        : "border-zinc-600 focus:border-fuchsia-500/50 focus:ring-fuchsia-500/50 focus-visible:ring-fuchsia-300"
                    }`}
                    placeholder={copy.contact.placeholderMessage}
                  />
                  {fieldErrors.message ? (
                    <p
                      id="message-error"
                      className="font-mono text-xs text-red-300/90 ml-1"
                    >
                      {fieldErrors.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col items-center gap-4 pt-2">
                  {keySwapped ? (
                    <p className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-center font-mono text-xs leading-relaxed text-red-100">
                      {copy.contact.turnstileKeySwapped}
                    </p>
                  ) : needsTurnstile ? (
                    <div className="flex min-h-[65px] w-full max-w-[300px] flex-col items-center justify-center">
                      {turnstileError ? (
                        <p className="rounded-lg border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-center font-mono text-xs leading-relaxed text-amber-100">
                          {turnstileError}
                        </p>
                      ) : (
                        <Turnstile
                          siteKey={rawSiteKey}
                          onSuccess={(token) => {
                            setTurnstileToken(token);
                            setTurnstileError(null);
                          }}
                          onExpire={() => setTurnstileToken(null)}
                          onError={(code) => {
                            setTurnstileToken(null);
                            setTurnstileError(
                              `${copy.contact.turnstileLoadError}${code ? ` (${code})` : ""}`,
                            );
                          }}
                          scriptOptions={{
                            onError: () =>
                              setTurnstileError(
                                copy.contact.turnstileLoadError,
                              ),
                          }}
                          options={{
                            theme: "dark",
                            size: "normal",
                            appearance: "always",
                            action: "contact-form",
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/40 px-4 py-3 text-center font-mono text-xs text-zinc-400">
                      {copy.contact.turnstileDisabled}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-4 pt-4">
                  {errorMessage && (
                    <p
                      role="alert"
                      className="font-mono text-xs text-red-300 tracking-wider"
                    >
                      &gt; {errorMessage}
                    </p>
                  )}
                  <MagneticButton className="inline-block">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="relative overflow-hidden group min-h-11 rounded-md border border-green-300/45 bg-zinc-950 px-6 py-3 font-mono text-sm text-green-100 transition-[color,background-color,scale] duration-150 ease-out hover:bg-fuchsia-500/20 hover:text-fuchsia-100 motion-safe:enabled:active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="flex flex-col items-center justify-center py-12 text-center transition-opacity duration-500 starting:opacity-0">
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
                <h3
                  ref={successHeadingRef}
                  tabIndex={-1}
                  className="text-2xl font-bold text-white mb-2 tracking-tight"
                >
                  {copy.contact.successTitle}
                </h3>
                <p className="text-zinc-200 max-w-md leading-relaxed">
                  {copy.contact.successBody1}
                  <br className="hidden sm:block" />
                  {copy.contact.successBody2}
                  <br className="hidden sm:block" />
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
        </div>
      </div>
    </section>
  );
}
