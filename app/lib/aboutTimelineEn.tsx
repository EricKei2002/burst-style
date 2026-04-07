import type { ReactNode } from "react";

export type GeekBulletTone = "fuchsia" | "blue" | "green" | "red";

export type GeekEnglishBlock = {
  lead: string;
  bullets: { tone: GeekBulletTone; tag: string; text: string }[];
  footer?: string;
};

export type ProEnglishBlock = {
  paragraphs: string[];
};

const toneClass: Record<GeekBulletTone, string> = {
  fuchsia: "text-fuchsia-400",
  blue: "text-blue-400",
  green: "text-green-400",
  red: "text-red-400",
};

export function GeekEnglishView({ block }: { block: GeekEnglishBlock }): ReactNode {
  return (
    <div className="space-y-4">
      <p>{block.lead}</p>
      <ul className="list-none space-y-2 pl-2">
        {block.bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span
              className={`${toneClass[b.tone]} font-mono text-xs shrink-0 mt-1`}
            >
              {b.tag}
            </span>
            <span>{b.text}</span>
          </li>
        ))}
      </ul>
      {block.footer ? <p>{block.footer}</p> : null}
    </div>
  );
}

export function ProEnglishView({ block }: { block: ProEnglishBlock }): ReactNode {
  return (
    <div className="space-y-4 text-zinc-300">
      {block.paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

/** Index order must match `timeline` in AboutSection.tsx */
export const ABOUT_TIMELINE_GEEK_EN: GeekEnglishBlock[] = [
  {
    lead: 'v2002.0 Initial Commit: Project "Eric Kei" launched in Wakayama Prefecture.',
    bullets: [
      { tone: "fuchsia", tag: "[Init]", text: 'Created new user "Eric Kei".' },
      { tone: "blue", tag: "[System]", text: "Core kernel (life) booted successfully." },
      {
        tone: "green",
        tag: "[Inherit]",
        text: "Inherited engineer trait from parent process (father).",
      },
    ],
  },
  {
    lead: "v2013.0 Early Access: First login to programming. Initial creativity parameters set.",
    bullets: [
      {
        tone: "green",
        tag: "[Add]",
        text: "Implemented visual script (Scratch) module.",
      },
      {
        tone: "fuchsia",
        tag: "[Improve]",
        text: "Tuned logic and creativity algorithms.",
      },
    ],
  },
  {
    lead: "v2015.0 Feature Update: Migrated to a full coding stack via a friend invite code.",
    bullets: [
      {
        tone: "blue",
        tag: "[Add]",
        text: "Added C# language support and Visual Studio environment.",
      },
      {
        tone: "fuchsia",
        tag: "[Build]",
        text: "Deployed custom calculator application.",
      },
    ],
  },
  {
    lead: "v2019.0 Hardware Upgrade: Optimization pipeline extended beyond software into the runtime (hardware).",
    bullets: [
      {
        tone: "green",
        tag: "[Optimize]",
        text: "CPU/GPU performance tuning via overclocking.",
      },
      {
        tone: "blue",
        tag: "[Add]",
        text: "Added custom PC build capability.",
      },
    ],
  },
  {
    lead: "v2019.1 Global Connect: Connected to the Silicon Valley cluster. Engineer worldview updated.",
    bullets: [
      {
        tone: "fuchsia",
        tag: "[Access]",
        text: "Established routes to global HQs (Google, Meta, Intel).",
      },
      {
        tone: "green",
        tag: "[Sync]",
        text: "Synced tech culture and innovation mindset.",
      },
    ],
  },
  {
    lead: "v2020.0 Security Patch: Study-abort error from pandemic—force-routed into digital space.",
    bullets: [
      {
        tone: "red",
        tag: "[Fix]",
        text: "Established remote comm protocol (Discord).",
      },
      {
        tone: "blue",
        tag: "[Add]",
        text: "Added Tokyo share-house region and social skills.",
      },
    ],
  },
  {
    lead: "v2022.1 Localization Update: Synced virtual friendship data to the physical layer (reality).",
    bullets: [
      {
        tone: "green",
        tag: "[Sync]",
        text: "Synced online friends to physical connection (Canada).",
      },
      {
        tone: "fuchsia",
        tag: "[Improve]",
        text: "Extended English comm plugin and global map data.",
      },
    ],
  },
  {
    lead: "v2022.2 Physics Engine Update: Snowboard physics performance pushed toward the limit.",
    bullets: [
      {
        tone: "blue",
        tag: "[Add]",
        text: "Applied sub-zero adaptation patch (Hakuba / Niseko).",
      },
      {
        tone: "green",
        tag: "[Background]",
        text: "Self-taught programming process running in background.",
      },
    ],
  },
  {
    lead: "v2025.0 Major Refactor: Engineering skills fully migrated to the modern stack.",
    bullets: [
      {
        tone: "fuchsia",
        tag: "[Add]",
        text: "Added TypeScript & React support.",
      },
      {
        tone: "blue",
        tag: "[Fix]",
        text: "Resolved type-safety and component design issues.",
      },
    ],
  },
  {
    lead: "v2026.0 Infrastructure Expansion: Deployed Linux server to local environment.",
    bullets: [
      {
        tone: "green",
        tag: "[Deploy]",
        text: "Deployed home server (Raspberry Pi 4).",
      },
      {
        tone: "blue",
        tag: "[Improve]",
        text: "Strengthened network and OS architecture knowledge base.",
      },
    ],
  },
  {
    lead: "v2026.1 Stable Release: Shipped to production (career). Personal site still runs as an experiment field.",
    bullets: [
      {
        tone: "fuchsia",
        tag: "[Ship]",
        text: "Joined product development as a frontend engineer.",
      },
      {
        tone: "blue",
        tag: "[Keep]",
        text:
          "Self-taught stack and personal R&D loop kept on a maintenance channel.",
      },
      {
        tone: "green",
        tag: "[Note]",
        text:
          "Spec: “curiosity” consumes memory, but paying it down across work and side projects.",
      },
    ],
    footer:
      "For collabs or a quick ping—same as always, reach me via Contact.",
  },
];

export const ABOUT_TIMELINE_PRO_EN: ProEnglishBlock[] = [
  {
    paragraphs: [
      "Born in Wakayama Prefecture. I grew up strongly influenced by my father, an engineer.",
      "Seeing him work from home every day made “IT work that isn’t tied to one place” feel natural and exciting. Curiosity from a green, open environment plus technology close at home became the foundation for who I am today.",
    ],
  },
  {
    paragraphs: [
      "My first step into programming was the visual language Scratch.",
      "I learned how fun it is to instruct a computer logically and watch ideas become real—early training in computational thinking.",
    ],
  },
  {
    paragraphs: [
      "Encouraged by friends, I moved into C# and serious tooling.",
      "With Visual Studio and Windows Forms I taught myself variables, control flow, OOP basics, and shipped a working calculator—learning to care about the user’s perspective, not only the code.",
    ],
  },
  {
    paragraphs: [
      "Alongside software, I went deep on hardware.",
      "Building PCs taught me how CPU, GPU, memory, and storage shape the whole system. Overclocking and tuning showed me how to find bottlenecks and iterate—core engineering practice.",
    ],
  },
  {
    paragraphs: [
      "In high school I visited Silicon Valley because a friend who had taught me C# joined Google. I toured Google, Meta, Intel, and more.",
      "Feeling how passionate people build world-changing tech pushed me to want to create value on the technology side myself.",
    ],
  },
  {
    paragraphs: [
      "When the pandemic changed study-abroad plans, I leaned into Discord and online communities.",
      "Games became a lane for international English practice and cross-cultural communication. Living in a Tokyo share house added more experience collaborating with people from different backgrounds.",
    ],
  },
  {
    paragraphs: [
      "I traveled solo to North America to meet friends I’d only known online.",
      "Living locally tested real-world English and proved I could plan and execute a big trip alone—turning digital relationships into trusted real-world ones deepened my interest in bridging online and offline.",
    ],
  },
  {
    paragraphs: [
      "I worked live-in jobs in resort towns like Hakuba and Niseko—international guests meant English was part of daily work.",
      "Harsh winter conditions built grit; off the clock I kept studying programming. I’m proud of adapting fast and sustaining effort toward a goal.",
    ],
  },
  {
    paragraphs: [
      "I focused on modern web skills—TypeScript, React, Next.js.",
      "Beyond tutorials I shipped apps like a Todo product to learn types, component design, SSR, and practical debugging—with AI tools as one accelerator in the loop.",
    ],
  },
  {
    paragraphs: [
      "To grow beyond the frontend, I run a home server on a Raspberry Pi with Linux, SSH, and Docker for apps like a Discord bot.",
      "Getting comfortable in the terminal and with networking pushes me toward a fuller-stack mindset.",
    ],
  },
  {
    paragraphs: [
      "I work as a frontend engineer on a product team.",
      "I care about shipping with React and TypeScript, contributing with adaptability and English communication, and keep experimenting with infra and AI outside work to widen my lens.",
    ],
  },
];
