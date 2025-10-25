"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";


export default function Hero() {
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrambleTextPlugin);

    if (!headlineRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headlineRef.current,
        {
          opacity: 0.2,
        },
        {
          opacity: 1,
          duration: 2.2,
          ease: "power2.out",
          scrambleText: {
            text: "ブランドに寄り添う、洗練されたデザインとクリエイティブを。",
            chars: "ﾃﾞｻﾞｲﾝBRSTYLE創造0123456789",
            speed: 0.5,
            revealDelay: 0.35,
          },
        },
      );
    }, headlineRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section className="flex flex-col items-center gap-10 text-center sm:flex-row sm:items-start sm:gap-16 sm:text-left">
      <div className="relative h-28 w-28 overflow-hidden rounded-full border border-zinc-200 shadow-sm dark:border-zinc-800">
        <Image
          src="/projects/cuttingworks.jpg"
          alt="Burst Style studio avatar"
          fill
          className="object-cover"
          sizes="112px"
          priority
        />
      </div>
      <div className="flex flex-1 flex-col gap-6">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-400">
            Burst Style 
          </p>
          <h1
            ref={headlineRef}
            className="text-3xl font-semibold leading-tight text-zinc-950 dark:text-zinc-50 md:text-4xl"
          >
            ブランドに寄り添う、洗練されたデザインとクリエイティブを。
          </h1>
        </div>
      </div>
    </section>
  );
}
