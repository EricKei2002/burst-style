import type { Project } from "./data";
import type { Locale } from "./siteCopy";

type EnOverlay = Pick<
  Project,
  "description" | "detailedDescription" | "challenges" | "improvements"
>;

const EN_BY_SLUG: Record<string, EnOverlay> = {
  drill: {
    description:
      "A daily 10-question drill PWA covering multiple study tracks—AWS SAA, WordPress, and more. Google sign-in and Supabase sync progress across devices.",
    detailedDescription:
      "A daily-practice PWA built around a 'study pack' architecture: questions, glossary, and domain weighting are swappable per subject, currently covering the AWS Certified Solutions Architect – Associate exam and WordPress admin/dev practice, with room to add more. Each day's 10 questions are allocated across a pack's domains and picked in deterministic priority order: unseen → missed → related topics → stale. Answers show an explanation and a one-line takeaway immediately, and missed topics get folded into the next day's set for review. Signing in with Google (via Supabase Auth) ties streaks, per-domain accuracy, and the target-date countdown to your account, so progress carries over between phone and desktop. A Learn tab lets you tap underlined acronyms to pop open their full name and meaning inline. Set your own Gemini API key and weak-spot questions get generated on the fly (the AWS pack also factors in the official What's New RSS), with Vercel Cron pre-generating each morning so there's no wait. Questions are original exercises grounded in each subject's official docs, not copies of real exam questions.",
    challenges: [
      {
        title: "Deterministic daily question selection",
        description:
          "A date-seeded hash drives a pseudo-random shuffle so reopening the app on the same day always yields the same 10 questions. Candidates are ranked unseen → high miss-rate → related topic → stale before drawing, balancing weak-spot review with new material.",
      },
      {
        title: "Carrying pre-login progress into an account",
        description:
          "Users can start solving immediately before signing in—progress is stashed in sessionStorage until Google login completes, then merged into Supabase via RPC (fetch_progress / push_progress). This preserves a 'try 10 questions, then sign in if you like it' flow while still syncing across devices.",
      },
      {
        title: "A study-pack architecture for multiple subjects",
        description:
          "Pulled questions, glossary, and domain weighting out of the AWS-specific code into a 'study pack' (StudyPack) abstraction. Selection logic, weak-spot tracking, and the AI generation engine stayed subject-agnostic in a shared core, so adding the WordPress pack meant just writing a new pack definition.",
      },
    ],
    improvements: [
      {
        title: "More study packs",
        description:
          "Currently AWS SAA and WordPress—planning to add packs for more certifications and technical subjects over time.",
      },
      {
        title: "Deeper study analytics",
        description:
          "Beyond per-domain accuracy, exploring a dashboard for time-of-day performance and correlations between missed topics.",
      },
    ],
  },
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
