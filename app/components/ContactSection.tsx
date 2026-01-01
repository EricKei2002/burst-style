"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import DecryptedText from "./DecryptedText";
import MagneticButton from "./MagneticButton";
import TiltCard from "./TiltCard";

export default function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

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
    setIsSubmitting(true);
    
    try {
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const response = await fetch('/api/contact', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            setIsSent(true);
            if (formRef.current) formRef.current.reset();
            // Reset state after 10 seconds
            setTimeout(() => setIsSent(false), 10000);
        } else {
            console.error('Submission failed');
            // Optimistically show success to user or show error? 
            // For a portfolio, maybe just showing "Sent" is better UX even if backend fails typically, 
            // but let's stick to truthy feedback for now.
             alert("送信に失敗しました。時間をおいて再度お試しください。");
        }
    } catch (error) {
        console.error('Submission error:', error);
        alert("送信エラーが発生しました。");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" ref={sectionRef} className="relative w-full py-24 sm:py-32">
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
                                        <DecryptedText text="CD// NAME" animateOnHover speed={20} />
                                    </label>
                                    <input 
                                        type="text" 
                                        id="name" 
                                        name="name"
                                        required
                                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-xs font-mono text-fuchsia-400 ml-1">
                                        <DecryptedText text="CD// EMAIL" animateOnHover speed={20} />
                                    </label>
                                    <input 
                                        type="email" 
                                        id="email" 
                                        name="email"
                                        required
                                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label htmlFor="message" className="text-xs font-mono text-fuchsia-400 ml-1">
                                    <DecryptedText text="CD// MESSAGE" animateOnHover speed={20} />
                                </label>
                                <textarea 
                                    id="message" 
                                    name="message"
                                    required
                                    rows={6}
                                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all resize-none"
                                    placeholder="Enter transmission data..."
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <MagneticButton strength={0.3} className="inline-block">
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="relative overflow-hidden group bg-zinc-100 text-zinc-950 px-8 py-3 rounded-full font-bold tracking-wide transition-all hover:bg-fuchsia-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            {isSubmitting ? 'TRANSMITTING...' : 'SEND TRANSMISSION'}
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
                             <div className="w-16 h-16 bg-fuchsia-500/20 text-fuchsia-400 rounded-full flex items-center justify-center mb-6">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                             </div>
                             <h3 className="text-2xl font-bold text-white mb-2">Transmission Received</h3>
                             <p className="text-zinc-400 max-w-md">
                                 通信を受信しました。内容を確認次第、安全な回線を通じて応答します。
                             </p>
                             <button 
                                onClick={() => setIsSent(false)}
                                className="mt-8 text-sm text-fuchsia-400 hover:text-fuchsia-300 underline underline-offset-4"
                             >
                                Send another message
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
