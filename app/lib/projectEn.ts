import type { Project } from "./data";
import type { Locale } from "./siteCopy";

type EnOverlay = Pick<
  Project,
  "description" | "detailedDescription" | "challenges" | "improvements"
>;

const EN_BY_SLUG: Record<string, EnOverlay> = {
  drill: {
    description:
      "Daily 10-question drill PWA for AWS SAA, WordPress, and security, synced across devices.",
    detailedDescription:
      "A 10-questions-a-day PWA for AWS SAA, WordPress admin/dev, and security. Subjects are swappable 'study packs'; 10 questions are picked deterministically by domain weighting, in order: unseen → missed → related → stale. Answers show an explanation and takeaway at once, and misses get priority in the Weak-Spot Drill. Google sign-in syncs streaks and accuracy via Supabase, and tapping an acronym shows its meaning. With your own Gemini API key, weak-spot questions are AI-generated (using official and vulnerability RSS feeds), pre-generated each morning by Vercel Cron; Web Push reminds you at 9 pm. Questions are originals based on official docs.",
    challenges: [
      {
        title: "Deterministic daily question selection",
        description:
          "A date-seeded shuffle gives the same 10 questions all day. Ranking by unseen, miss rate, related topic, and age balances review with new material.",
      },
      {
        title: "Carrying pre-login progress into an account",
        description:
          "Pre-login progress sits in sessionStorage, then merges into Supabase via RPC (fetch_progress / push_progress) after Google login: try first, sign in later.",
      },
      {
        title: "A study-pack architecture for multiple subjects",
        description:
          "Questions, glossary, and weighting live in a StudyPack. Selection, weak spots, and AI generation are shared, so a new subject is just a new pack.",
      },
    ],
    improvements: [
      {
        title: "More study packs",
        description:
          "Add packs for more certifications and technical subjects.",
      },
      {
        title: "Deeper study analytics",
        description: "Exploring a dashboard linking related missed topics.",
      },
    ],
  },
  "sonta-kun": {
    description: "AI scheduling that reads the room.",
    detailedDescription:
      'An AI scheduling agent born from sontaku, Japanese "reading the air". Google Gemini turns fuzzy wishes into constraints, checks Google Calendar, and proposes the best times.',
    challenges: [
      {
        title: "Fuzzy natural language → concrete constraints",
        description:
          'A Gemini-based "sontaku engine" maps "next week, early afternoon" to ISO date ranges.',
      },
      {
        title: "Seamless external integrations",
        description:
          "Google Calendar, Zoom, and Resend in Server Actions, with token and error handling for one smooth flow.",
      },
    ],
    improvements: [
      {
        title: "Smarter consideration logic",
        description: "Factor travel time and lunch into suggestions.",
      },
      {
        title: "Multi-person & multimodal",
        description:
          "Exploring multi-person calendar sync and UIs beyond chat.",
      },
    ],
  },
  "cutting-works": {
    description:
      "Cutting-sticker design site with intuitive browsing and a portfolio gallery.",
    detailedDescription:
      "Official site for Cutting Works, a cutting-sticker maker and shop, with an intuitive gallery UI. Works live in static TypeScript data (app/data/works.ts) and images are optimized with next/image: fast, with no CMS. Inquiries go through mailto.",
    challenges: [
      {
        title: "Image-heavy performance",
        description:
          "next/image, WebP, and lazy loading improved Core Web Vitals without losing quality.",
      },
      {
        title: "Simple static operations",
        description:
          "Updates are rare, so a static array replaces a CMS. Vercel rebuilds on deploy and Git keeps the history.",
      },
    ],
    improvements: [
      {
        title: "Search & filters",
        description: "Instant search to find designs quickly.",
      },
      {
        title: "Better inquiry flow",
        description:
          "An on-site quote form that carries over the selected design.",
      },
    ],
  },
  "discord-role-bot": {
    description:
      "Discord intro-verification bot, run on a home server with CI/CD.",
    detailedDescription:
      "New members click verify, fill in a modal, and get a role automatically, removing manual approval and lowering the join barrier. Runs on a home Raspberry Pi; logs go to a mod channel as embeds, with no database.",
    challenges: [
      {
        title: "Uptime & error handling",
        description:
          "Docker, exception handling, and auto-reconnect keep it up 24/7 through drops and rate limits.",
      },
      {
        title: "Deploy automation",
        description:
          "GitHub Actions CI/CD tests and deploys on every push to main.",
      },
      {
        title: "Testable core logic",
        description:
          "Vitest unit-tests the auth logic without the Discord API, easing maintenance.",
      },
    ],
    improvements: [
      {
        title: "Web settings dashboard",
        description: "Change channels and roles from a browser.",
      },
      {
        title: "Multi-guild support",
        description:
          "Store settings in a DB (e.g. MongoDB) to support many servers.",
      },
    ],
  },
  "burst-style": {
    description:
      "Immersive portfolio SPA: a space journey built with Three.js and cinematic motion.",
    detailedDescription:
      "A space-journey portfolio. Beyond the Three.js visuals, Zustand syncs a full-screen warp with navigation: the page changes while the shader covers the screen and appears as you drop out. Turnstile spam protection and a Resend auto-reply care for the unseen side too.",
    challenges: [
      {
        title: "Seamless transitions & state",
        description:
          "Zustand (`useTransitionStore`) syncs `router.push` with the shader for load-free travel. Without WebGL, or with reduced motion, the warp is skipped.",
      },
      {
        title: "Narrative contact flow",
        description:
          "A serverless function runs Turnstile, Formspree notification, and a Resend auto-reply styled like a ship console.",
      },
      {
        title: "Performance vs. visuals",
        description:
          "Planet backdrops are stills pre-rendered in Blender, so they cost no rendering time on the device. The React Three Fiber starfield on Home adapts to the hardware, and the warp shader loads on navigation intent.",
      },
    ],
    improvements: [
      {
        title: "Richer interaction",
        description: "Exploring 3D reactions to pointer and scroll.",
      },
      {
        title: "Internationalization",
        description: "The EN/JA toggle is live; copy polish is next.",
      },
    ],
  },
};

// OGP画像など日本語フォントを使えない場所で使う英語タイトル（未登録なら元のタイトル）
const TITLE_EN_BY_SLUG: Record<string, string> = {
  "discord-role-bot": "Discord Intro Verification Bot",
  "sonta-kun": "Sonta-kun",
};

export function getProjectTitleEn(project: Project): string {
  return TITLE_EN_BY_SLUG[project.slug] ?? project.title;
}

export function getLocalizedProject(project: Project, locale: Locale): Project {
  if (locale !== "en") return project;
  const en = EN_BY_SLUG[project.slug];
  if (!en) return project;
  return {
    ...project,
    description: en.description,
    detailedDescription: en.detailedDescription,
    challenges: en.challenges,
    improvements: en.improvements,
  };
}
