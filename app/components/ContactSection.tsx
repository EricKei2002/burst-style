"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import DecryptedText from "./DecryptedText";
import MagneticButton from "./MagneticButton";
import TiltCard from "./TiltCard";
import { Turnstile } from '@marsidev/react-turnstile';

export default function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(".contact-header",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          }
        }
      );

      // Form animation
      gsap.fromTo(".contact-form",
        { y: 50, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          delay: 0.2,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
        if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
             setErrorMessage("ERROR: CONFIGURATION MISSING (SITE_KEY).");
        } else {
             setErrorMessage("ERROR: SECURITY CHECK FAILED. PLEASE VERIFY YOU ARE HUMAN.");
        }
        return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    
    try {
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        formData.append('cf-turnstile-response', turnstileToken);

        const response = await fetch('/api/contact', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            setIsSent(true);
            if (formRef.current) formRef.current.reset();
            setTurnstileToken(null);
            // Reset state after 10 seconds
            setTimeout(() => setIsSent(false), 10000);
        } else {
            console.error('Submission failed');
            setErrorMessage("ERROR: TRANSMISSION FAILED. PLEASE RETRY.");
        }
    } catch (error) {
        console.error('Submission error:', error);
        setErrorMessage("CRITICAL ERROR: CONNECTION LOST.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" ref={sectionRef} className="relative w-full py-24 sm:py-32 overflow-clip">
       <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Header */}
        <div className="contact-header mb-16 max-w-2xl">
          <div className="flex items-center gap-2 text-fuchsia-400 mb-4">
            <span className="h-px w-8 bg-current"></span>
            <span className="font-mono text-xs tracking-wider uppercase">03. Contact</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
            <DecryptedText text="Get In Touch" animateOnHover speed={30} />
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            新しいプロジェクト、コラボレーション、またはカジュアルな挨拶まで。<br />
            『Burst Style』への通信回線は常に開かれています。
          </p>
        </div>

        {/* Contact Form Area */}
        <div className="contact-form relative mx-auto max-w-3xl">
            <TiltCard rotationIntensity={2} className="w-full">
                <div className="relative w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 sm:p-12 overflow-hidden backdrop-blur-sm">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                         <div className="w-16 h-16 border-t border-r border-fuchsia-500 rounded-tr-xl"></div>
                    </div>
                    <div className="absolute bottom-0 left-0 p-4 opacity-20">
                         <div className="w-16 h-16 border-b border-l border-fuchsia-500 rounded-bl-xl"></div>
                    </div>

                    {!isSent ? (
                        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-xs font-mono text-fuchsia-400 ml-1">
                                        <DecryptedText text="NAME / お名前" animateOnHover speed={20} />
                                    </label>
                                    <input 
                                        type="text" 
                                        id="name" 
                                        name="name"
                                        required
                                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-sans"
                                        placeholder="山田 太郎"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-xs font-mono text-fuchsia-400 ml-1">
                                        <DecryptedText text="EMAIL / メールアドレス" animateOnHover speed={20} />
                                    </label>
                                    <input 
                                        type="email" 
                                        id="email" 
                                        name="email"
                                        required
                                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-sans"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label htmlFor="message" className="text-xs font-mono text-fuchsia-400 ml-1">
                                    <DecryptedText text="MESSAGE / 本文" animateOnHover speed={20} />
                                </label>
                                <textarea 
                                    id="message" 
                                    name="message"
                                    required
                                    rows={6}
                                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all resize-none font-sans"
                                    placeholder="お問い合わせ内容をご入力ください..."
                                />
                            </div>

                            <div className="flex flex-col items-center gap-4 pt-2">
                                <Turnstile 
                                    // TEMPORARY DEBUG: Paste your Site Key directly here to test
                                    // process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""
                                    siteKey="0x4AAAAAACMEdoY3D-U7Ag2L"
                                    onSuccess={setTurnstileToken}
                                    options={{
                                        theme: 'dark',
                                        action: 'contact-form',
                                    }}
                                />
                            </div>

                            <div className="flex flex-col items-end gap-4 pt-4">
                                {errorMessage && (
                                    <p className="font-mono text-xs text-red-500 tracking-wider animate-pulse">
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
                                            {isSubmitting ? 'TRANSMITTING...' : 'TRANSMIT / 送信'}
                                            {!isSubmitting && (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                                            )}
                                        </span>
                                    </button>
                                </MagneticButton>
                            </div>
                        </form>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-500">
                             <div className="w-16 h-16 bg-fuchsia-500/20 text-fuchsia-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                             </div>
                             <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Transmission Complete</h3>
                             <p className="text-zinc-400 max-w-md leading-relaxed">
                                 お問い合わせありがとうございます。<br/>
                                 送信されたデータは正常に受信されました。<br/>
                                 確認次第、折り返しご連絡いたします。
                             </p>
                             <button 
                                onClick={() => setIsSent(false)}
                                className="mt-8 text-sm text-fuchsia-400 hover:text-fuchsia-300 underline underline-offset-4 font-mono uppercase tracking-wider"
                             >
                                &lt; Send another message
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
