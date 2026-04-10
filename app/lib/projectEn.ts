import type { Project } from "./data";
import type { Locale } from "./siteCopy";

type EnOverlay = Pick<
  Project,
  "description" | "detailedDescription" | "challenges" | "improvements"
>;

const EN_BY_SLUG: Record<string, EnOverlay> = {
  "sonta-kun": {
    description:
      "AI scheduling that reads the room—natural language to calendar slots.",
    detailedDescription:
      'Sonta-kun is an AI scheduling agent inspired by Japanese "reading the air" (sontaku). It uses Google Gemini to turn fuzzy wishes like "sometime next week, earlier afternoon" into real constraints, checks Google Calendar availability, and proposes the best times—with Zoom and email wired in via Server Actions.',
    challenges: [
      {
        title: "Fuzzy natural language → concrete constraints",
        description:
          'Built a "sontaku engine" on Gemini that maps phrases like "next week, earlier afternoon" to ISO ranges. Prompt design and context handling keep extraction accurate.',
      },
      {
        title: "Seamless external integrations",
        description:
          "Combined Google Calendar, Zoom, and Resend inside Server Actions with solid token handling and errors—users get one smooth flow without seeing the plumbing.",
      },
    ],
    improvements: [
      {
        title: "Smarter consideration logic",
        description:
          "Move beyond bare free slots: factor in travel buffers and lunch so suggestions feel genuinely thoughtful.",
      },
      {
        title: "Multi-person & multimodal",
        description:
          "Exploring multi-calendar sync, more participants, and interfaces beyond pure chat.",
      },
    ],
  },
  "cutting-works": {
    description:
      "Cutting-sticker brand site: gallery UI, intuitive browsing, MicroCMS for updates.",
    detailedDescription:
      "Official site for Cutting Works, a cutting-sticker studio and shop. Built a strong gallery-first UI so visitors can scan a large catalog quickly. MicroCMS lets the client publish portfolio pieces and news without touching code—operations stay lightweight.",
    challenges: [
      {
        title: "Image-heavy performance",
        description:
          "Many sticker assets made LCP a risk. Tuned next/image, WebP, and lazy loading to keep quality while improving Core Web Vitals.",
      },
      {
        title: "Reducing ops load",
        description:
          "Moved content updates from engineer-led code changes to MicroCMS so non-technical staff can publish through a simple admin UI.",
      },
    ],
    improvements: [
      {
        title: "Search & filters",
        description:
          "Plan instant search as the catalog grows so people reach the right design fast.",
      },
      {
        title: "In-site quote flow",
        description:
          "Today we link out for quotes; next step is carrying selected designs into an on-site request flow.",
      },
    ],
  },
  "discord-role-bot": {
    description:
      "Discord onboarding bot: self-serve intro + role grant, home server + CI/CD.",
    detailedDescription:
      "A Discord bot for community onboarding: users click verify, fill a modal, and get a role automatically—cutting manual admin work and lowering the join barrier. Runs on a home Raspberry Pi. Audit trail uses embed posts to a mod channel instead of a database.",
    challenges: [
      {
        title: "Uptime & error handling",
        description:
          "Needed 24/7 resilience to blips and rate limits. Docker plus reconnect logic and careful exception handling keep it stable long term.",
      },
      {
        title: "Deploy automation",
        description:
          "GitHub Actions CI/CD deploys from main to the Pi so releases are repeatable and less error-prone than manual SSH.",
      },
      {
        title: "Testable core logic",
        description:
          "Vitest tests the auth flow without hitting Discord live, so rules stay verifiable as the bot evolves.",
      },
    ],
    improvements: [
      {
        title: "Web settings dashboard",
        description:
          "Goal: change channels and roles from a browser instead of config files only.",
      },
      {
        title: "Multi-guild support",
        description:
          "Today tuned for one server; planning DB-backed config for many installs.",
      },
    ],
  },
  "burst-style": {
    description:
      "Immersive portfolio: spaceship boarding concept, Three.js, cinematic motion.",
    detailedDescription:
      "Burst Style merges heavy visual storytelling with solid engineering. Three.js and motion sell the space journey; Zustand syncs the hangar-door transition with Next.js navigation so the door closes, the route changes, and the interior opens as one beat. Behind the scenes: Turnstile spam protection, Formspree forwarding, and a Resend auto-reply styled like a ship console so the vibe continues after submit.",
    challenges: [
      {
        title: "Seamless transitions & state",
        description:
          "Global transition state aligns CSS door animation with `router.push` timing so navigation feels like one continuous scene, not a hard reload.",
      },
      {
        title: "Narrative contact flow",
        description:
          "Contact is part of the story: verify with Turnstile, notify via Formspree, auto-reply via Resend with on-brand HTML.",
      },
      {
        title: "Performance vs. visuals",
        description:
          "Particles plus video cost GPU budget. Reduced unnecessary rerenders and gate the boot sequence with session storage so repeat visits stay smooth.",
      },
    ],
    improvements: [
      {
        title: "Richer interaction",
        description:
          "Explore scroll- and pointer-driven reactions in the 3D backdrop beyond ambient motion.",
      },
      {
        title: "Internationalization",
        description:
          "English/Japanese site copy and locale toggle are live; more polish and project-level translations can follow.",
      },
    ],
  },
};

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
