export type Locale = "en" | "ja";

export function pick(locale: Locale, pair: Record<Locale, string>): string {
  return pair[locale];
}

const NOW_ENTRIES: { en: string; ja: string; highlight?: boolean }[] = [
  {
    en: "Frontend-first, with ongoing curiosity around AI and infra. Weekends often go to the home server and small UI experiments.",
    ja: "フロントエンドを軸に、AI・インフラ寄りの学習も継続中。週末は自宅サーバや小さめのUI実験に時間を使うことが多いです。",
  },
  {
    en: "Burst Style is my personal activity log and playground. Updates may be slow—thanks for sticking around.",
    ja: "Burst Style は「個人の活動ログ」と「遊び場」として育てる予定です。更新は気長にお付き合いください。",
    highlight: true,
  },
];

export function buildSiteCopy(locale: Locale) {
  return {
    header: {
      langToggle: pick(locale, {
        en: "Language: English / 日本語",
        ja: "言語: English / 日本語",
      }),
      langEn: pick(locale, { en: "EN", ja: "EN" }),
      langJa: pick(locale, { en: "JA", ja: "JA" }),
    },
    hero: {
      establishing: "> ESTABLISHING CONNECTION...",
      question: pick(locale, {
        en: "> What is Burst Style ?",
        ja: "> Burst Style とは？",
      }),
      enterAria: pick(locale, {
        en: "Show details",
        ja: "詳細を表示する",
      }),
      tagline1: pick(locale, {
        en: '"Burst Style" — creativity that explodes into unfamiliar, memorable experiences.',
        ja: "「Burst Style」— 創造性を爆発させ、未知の体験を形にする。",
      }),
      tagline2: pick(locale, {
        en: "As a web engineer, I ship value that breaks the usual frame—with passion as the engine.",
        ja: "Webエンジニアとしての情熱を原動力に、既存の枠を打ち破る新しい価値を実装します。",
      }),
    },
    projects: {
      introLine1: pick(locale, {
        en: "Breaking defaults to build memorable experiences.",
        ja: "既成概念を打ち砕き、記憶に残る体験を。",
      }),
      introLine2: pick(locale, {
        en: "Burst Style—where design and engineering meet.",
        ja: "デザインと技術を融合した『Burst Style』の実践。",
      }),
      viewDetails: (title: string) =>
        locale === "ja" ? `「${title}」の詳細を見る` : `View details for ${title}`,
    },
    now: {
      sectionIntro: pick(locale, {
        en: "Personal focus alongside my day job—short logs, updated when I can.",
        ja: "就職後も続ける個人の関心ごと。短いログとして更新していきます。",
      }),
      lead: pick(locale, {
        en: "Balancing day job and side experiments—this site is where I stack notes and prototypes.",
        ja: "本業と個人プロジェクトのバランスを取りながら、このサイトで実験と記録を積み上げています。",
      }),
      entries: NOW_ENTRIES.map((e) => ({
        text: pick(locale, { en: e.en, ja: e.ja }),
        highlight: e.highlight,
      })),
      disclaimer: pick(locale, {
        en: "Views here are my own and do not represent the official position of any organization I belong to.",
        ja: "このサイトに掲載する内容は個人の見解であり、所属する組織の公式見解を代表するものではありません。",
      }),
      lastUpdated: pick(locale, { en: "Last updated", ja: "最終更新" }),
    },
    lab: {
      sectionIntro: pick(locale, {
        en: "Work-in-progress and spikes—not every experiment ships. Interactive demos also live in the About timeline.",
        ja: "完成品ではない試行錯誤。インタラクティブなものは About のタイムライン内にも配置しています。",
      }),
      items: [
        {
          title: "C# Calculator (browser)",
          description: pick(locale, {
            en: "A tiny demo you can use inside the About timeline—nostalgia from early learning, packaged as UI.",
            ja: "About タイムライン内でそのまま操作できるミニデモ。学習初期のノスタルジアを UI に落とし込んだ実験です。",
          }),
          cta: pick(locale, { en: "Jump to demo", ja: "デモへジャンプ" }),
          actionAria: pick(locale, {
            en: "Jump to C# calculator demo in the About section",
            ja: "About セクションの C# 電卓デモへ移動",
          }),
          tags: ["C#", "UI", "Demo"] as const,
          link: { kind: "hash" as const, id: "about-lab-csharp" },
        },
        {
          title: "Todo + TypeScript",
          description: pick(locale, {
            en: "A learning widget for type-safe React patterns—state and component boundaries.",
            ja: "型安全な React パターンの学習用ウィジェット。状態管理とコンポーネント分割の練習台です。",
          }),
          cta: pick(locale, { en: "Jump to demo", ja: "デモへジャンプ" }),
          actionAria: pick(locale, {
            en: "Jump to Todo demo in the About section",
            ja: "About セクションの Todo デモへ移動",
          }),
          tags: ["TypeScript", "React"] as const,
          link: { kind: "hash" as const, id: "about-lab-todo" },
        },
        {
          title: "Burst Style (this site)",
          description: pick(locale, {
            en: "Next.js plus visual experiments—transitions, scroll, 3D—the portfolio is part of the work.",
            ja: "Next.js とビジュアル表現の実験場。遷移・スクロール・3D など、ポートフォリオ自体が作品になっています。",
          }),
          cta: pick(locale, { en: "Case study", ja: "ケーススタディ" }),
          actionAria: pick(locale, {
            en: "Open case study for Burst Style (this site)",
            ja: "Burst Style（本サイト）のケーススタディを開く",
          }),
          tags: ["Next.js", "Creative"] as const,
          link: { kind: "project" as const, slug: "burst-style" },
        },
      ],
    },
    writing: {
      sectionIntro: pick(locale, {
        en: "Longer thoughts and articles live on external platforms—this section is the index.",
        ja: "コード以外の思考や記事は、外部サービスとここを行き来しながら整理していきます。",
      }),
      cards: [
        {
          title: "GitHub",
          description: pick(locale, {
            en: "Repos, small experiments, and learning scraps.",
            ja: "リポジトリ・細かな実験コード・学習ログの置き場です。",
          }),
          badge: "Code",
          href: "https://github.com/EricKei2002",
          hrefLabel: pick(locale, { en: "Open profile", ja: "プロフィールを開く" }),
        },
        {
          title: "Articles",
          description: pick(locale, {
            en: "When I publish on Zenn, note, or elsewhere, I’ll link it from here.",
            ja: "Zenn / note などで記事を公開したら、ここからリンクを貼っていく予定です。",
          }),
          badge: "Writing",
        },
      ],
      linkSoon: pick(locale, { en: "Link coming soon", ja: "リンクは準備中です" }),
    },
    about: {
      intro: pick(locale, {
        en: "Background and milestones in a timeline—how I grew into the work I do now.",
        ja: "技術と経験を積み上げてきた背景を、タイムライン形式で紹介します。",
      }),
      viewNow: pick(locale, { en: "View Now", ja: "Now を見る" }),
      contactCta: pick(locale, { en: "Contact", ja: "お問い合わせ" }),
      geekModeLabel: pick(locale, {
        en: "Geek Mode",
        ja: "ギークモード",
      }),
      proModeLabel: pick(locale, {
        en: "Pro Mode",
        ja: "プロモード",
      }),
      switchGeekAria: pick(locale, {
        en: "Switch to Geek Mode",
        ja: "ギークモードに切り替え",
      }),
      switchProAria: pick(locale, {
        en: "Switch to Pro Mode",
        ja: "プロモードに切り替え",
      }),
      videoPlay: (title: string) =>
        pick(locale, {
          en: `Play video: ${title}`,
          ja: `「${title}」の動画を再生`,
        }),
    },
    contact: {
      leadLine1: pick(locale, {
        en: "New projects, collaboration, or a casual hello—",
        ja: "新しいプロジェクト、コラボレーション、またはカジュアルな挨拶まで。",
      }),
      leadLine2: pick(locale, {
        en: "the line to Burst Style stays open.",
        ja: "『Burst Style』への通信回線は常に開かれています。",
      }),
      formName: pick(locale, { en: "NAME", ja: "お名前" }),
      formEmail: pick(locale, { en: "EMAIL", ja: "メール" }),
      formMessage: pick(locale, { en: "MESSAGE", ja: "本文" }),
      placeholderName: pick(locale, {
        en: "Your name",
        ja: "山田 太郎",
      }),
      placeholderEmail: pick(locale, {
        en: "you@example.com",
        ja: "email@example.com",
      }),
      placeholderMessage: pick(locale, {
        en: "What would you like to say?",
        ja: "お問い合わせ内容をご入力ください...",
      }),
      securityLoading: pick(locale, {
        en: "SECURITY CHECK LOADING...",
        ja: "セキュリティ確認を読み込み中...",
      }),
      turnstileDisabled: pick(locale, {
        en: "Turnstile disabled: set NEXT_PUBLIC_TURNSTILE_SITE_KEY in .env.local to enable the widget.",
        ja: "Turnstile 未設定: .env.local に NEXT_PUBLIC_TURNSTILE_SITE_KEY を設定するとウィジェットが有効になります。",
      }),
      errTurnstile: pick(locale, {
        en: "Security check not ready. Wait for Turnstile to finish loading, then try again.",
        ja: "セキュリティ確認の準備ができていません。読み込み完了後に再試行してください。",
      }),
      errTransmit: pick(locale, {
        en: "Transmission failed. Please try again.",
        ja: "送信に失敗しました。もう一度お試しください。",
      }),
      errConnection: pick(locale, {
        en: "Connection error. Please try again.",
        ja: "接続エラーです。もう一度お試しください。",
      }),
      sending: pick(locale, { en: "SENDING...", ja: "送信中..." }),
      send: pick(locale, { en: "SEND MESSAGE", ja: "送信する" }),
      successTitle: pick(locale, { en: "Message received", ja: "送信完了" }),
      successBody1: pick(locale, { en: "Thanks for reaching out.", ja: "お問い合わせありがとうございます。" }),
      successBody2: pick(locale, {
        en: "Your message was delivered successfully.",
        ja: "送信されたデータは正常に受信されました。",
      }),
      successBody3: pick(locale, {
        en: "I’ll get back to you as soon as I can.",
        ja: "確認次第、折り返しご連絡いたします。",
      }),
      sendAnother: pick(locale, {
        en: "< Send another message",
        ja: "< 別のメッセージを送る",
      }),
    },
  };
}

export const NOW_UPDATED = "2026-04-07";

export type SiteCopy = ReturnType<typeof buildSiteCopy>;
