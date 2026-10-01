import type { Locale } from "./siteCopy";

// Aboutセクションの「スキル（習熟度別）」表示用データ
export interface SkillGroup {
  id: "core" | "built" | "learning";
  label: Record<Locale, string>;
  note: Record<Locale, string>;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    id: "core",
    label: { en: "Daily Driver", ja: "実務・日常的に使用" },
    note: {
      en: "Used at work and in every project",
      ja: "業務と個人開発の両方で常用",
    },
    items: [
      "HTML / CSS",
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js (App Router)",
      "Tailwind CSS",
      "WordPress",
    ],
  },
  {
    id: "built",
    label: { en: "Shipped in Projects", ja: "個人開発で使用" },
    note: {
      en: "Built and running in my own projects",
      ja: "自作プロダクトで実装・運用",
    },
    items: [
      "Three.js / React Three Fiber",
      "GSAP",
      "Zustand",
      "Supabase (Postgres / Auth)",
      "Node.js",
      "Discord.js",
      "Gemini API",
      "Resend",
      "Vercel",
      "Docker",
      "Linux / Raspberry Pi",
      "Tailscale",
      "GitHub Actions",
      "Vitest",
    ],
  },
  {
    id: "learning",
    label: { en: "Learning", ja: "学習中" },
    note: {
      en: "Actively studying",
      ja: "現在キャッチアップ中",
    },
    items: ["AWS (SAA)", "Blender"],
  },
];
