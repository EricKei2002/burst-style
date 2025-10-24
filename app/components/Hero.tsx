"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

const socials = [
  {
    href: "https://www.dribbble.com",
    label: "Dribbble",
  },
  {
    href: "https://www.behance.net",
    label: "Behance",
  },
  {
    href: "mailto:hello@burst.style",
    label: "Email",
  },
];

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
            Burst Style Studio
          </p>
          <h1
            ref={headlineRef}
            className="text-3xl font-semibold leading-tight text-zinc-950 dark:text-zinc-50 md:text-4xl"
          >
            ブランドに寄り添う、洗練されたデザインとクリエイティブを。
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
          {socials.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-900 transition-colors hover:border-zinc-900 hover:bg-zinc-900 hover:text-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-50 dark:hover:bg-zinc-50 dark:hover:text-zinc-950"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
