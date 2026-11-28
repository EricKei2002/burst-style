export interface Project {
  slug: string;
  title: string;
  description: string;
  detailedDescription: string;
  image: string;
  siteUrl?: string;
  githubUrl?: string;
  tags: string[];
  techStack: { name: string; icon?: string }[];
  challenges: { title: string; description: string }[];
  improvements: { title: string; description: string }[];
  documentation: {
    architectureHtmlUrl: string;
  };
}

export const projectsData: Project[] = [
  {
    slug: "drill",
    title: "Drill",
    description:
      "毎日10問の学習ドリルPWA。AWS SAA・WordPress・セキュリティに対応し、進捗は端末間で同期。",
    detailedDescription:
      "AWS SAA・WordPress運用/開発・セキュリティを学べる「毎日10問」のPWA。分野は『学習パック』で追加でき、各パックの配点比率に沿って「未見→誤答→似た論点→古い」の順に10問を決定論的に選びます。解答直後に解説と「持ち帰る一文」を表示し、誤答は弱点ドリルで優先出題。GoogleログインすればSupabaseで連続日数や正答率を端末間同期し、略称はタップで意味を確認できます。自分のGemini APIキーで弱点問題をAI生成でき（公式RSSや脆弱性情報も加味）、Vercel Cronが毎朝事前生成、夜21時はWeb Pushでリマインド。問題は公式ドキュメント等に基づくオリジナルです。",
    image: "/projects/drill-logo.png",
    siteUrl: "https://drill.burst.style",
    githubUrl: "https://github.com/EricKei2002/saa-drill",
    tags: ["Next.js", "TypeScript", "Supabase", "PWA"],
    techStack: [
      { name: "Framework: Next.js 16 (App Router) / React 19" },
      { name: "Language: TypeScript" },
      { name: "Styling: Tailwind CSS v4（ダークUI）" },
      { name: "Auth: Supabase Auth（Google）" },
      { name: "Database: Supabase（Postgres + RPC）" },
      {
        name: "AI: Google Gemini API（弱点問題のパーソナライズ生成、ユーザー自身のAPIキー）",
      },
      {
        name: "通知: Web Push（VAPID）+ Vercel Cron（日課リマインダー / AI問題の事前生成）",
      },
      { name: "配信: Vercel / PWA（manifest + Service Worker）" },
    ],
    challenges: [
      {
        title: "「今日の10問」の決定論的な抽選",
        description:
          "日付をシードにした疑似乱数で、同じ日なら同じ10問に。未出題・誤答率・似た論点・経過日数で優先順位をつけ、弱点補強と新規学習を両立しました。",
      },
      {
        title: "未ログイン進捗とアカウントの引き継ぎ",
        description:
          "ログイン前の進捗はsessionStorageに退避し、Googleログイン後にSupabaseのRPC（fetch_progress / push_progress）へマージ。「先に解いて、気に入ったらログイン」を実現しました。",
      },
      {
        title: "学習パック方式による複数分野対応",
        description:
          "問題・用語・配点比率を『学習パック（StudyPack）』に分離。抽選・弱点管理・AI生成は共通コアなので、パック定義を書くだけで分野を追加できます。",
      },
    ],
    improvements: [
      {
        title: "学習パックのさらなる拡充",
        description: "他の資格・技術分野のパックを追加したいと考えています。",
      },
      {
        title: "学習分析の強化",
        description:
          "間違えた論点同士の関連を可視化するダッシュボードを検討中です。",
      },
    ],
    documentation: {
      architectureHtmlUrl: "/projects/saa-drill-architecture.html",
    },
  },
  {
    slug: "sonta-kun",
    title: "Sontaくん",
    description: "空気を読む、AI日程調整ツール",
    detailedDescription:
      "日本の「忖度」から生まれたAI日程調整エージェント。Google Geminiが「ふんわりした希望」から条件を読み取り、Googleカレンダーの空きと照合して最適な日時を提案します。",
    image: "/sontakun.jpg",
    siteUrl: "https://sontakun.burst.style/",
    githubUrl: "https://github.com/EricKei2002/Sontakun",
    tags: ["Next.js", "AI", "Supabase"],
    techStack: [
      { name: "Framework: Next.js (App Router)" },
      { name: "Database: Supabase (PostgreSQL)" },
      { name: "AI: Google Gemini API" },
      { name: "Integration: Google Calendar / Zoom / Resend" },
      { name: "Styling: Tailwind CSS" },
    ],
    challenges: [
      {
        title: "自然言語からの曖昧な制約抽出",
        description:
          "「来週の午後早め」をGemini APIで日時範囲（ISO文字列）に変換する「忖度エンジン」を開発しました。",
      },
      {
        title: "シームレスな外部連携",
        description:
          "Google Calendar・Zoom・ResendをServer Actionsで統合し、トークン管理とエラー処理でワンストップの調整を実現しました。",
      },
    ],
    improvements: [
      {
        title: "「気遣い」ロジックの強化",
        description: "移動時間や昼休みも考慮した提案へ改良予定です。",
      },
      {
        title: "マルチモーダル・複数人対応",
        description: "複数人のカレンダー同期や、チャット以外のUIを検討中です。",
      },
    ],
    documentation: {
      architectureHtmlUrl: "/projects/sonta-kun-architecture.html",
    },
  },
  {
    slug: "cutting-works",
    title: "Cutting Works",
    description:
      "カッティングステッカーのデザインサイト。直感的に選べるUIと制作実績ギャラリーを実装。",
    detailedDescription:
      "カッティングステッカー制作・販売「Cutting Works」の公式サイト。直感的に選べるギャラリーUIを構築しました。実績は静的TypeScriptデータ（app/data/works.ts）で管理し、画像はnext/imageで最適化。CMSなしの高速な構成で、お問い合わせはmailtoです。",
    image: "/projects/bg cwb.jpeg",
    siteUrl: "https://cuttingworks.burst.style",
    githubUrl: "https://github.com/EricKei2002/cutting-works-burst",
    tags: ["Next.js", "TypeScript", "Tailwind CSS"],
    techStack: [
      { name: "Framework: Next.js (App Router)" },
      { name: "データ: 静的TypeScript配列（app/data/works.ts）" },
      { name: "Styling: Tailwind CSS" },
      { name: "Language: TypeScript" },
      { name: "Hosting: Vercel" },
    ],
    challenges: [
      {
        title: "画像中心のパフォーマンス最適化",
        description:
          "next/image、WebP、遅延読み込みで、画質を保ちつつCore Web Vitalsを改善しました。",
      },
      {
        title: "シンプルな静的構成による運用",
        description:
          "更新頻度が低いためCMSは使わず静的配列で管理。Vercelの再ビルドで反映でき、履歴もGitに残ります。",
      },
    ],
    improvements: [
      {
        title: "検索・フィルタリング機能の強化",
        description:
          "目的のデザインを素早く探せるインスタントサーチを計画中です。",
      },
      {
        title: "お問い合わせ体験の改善",
        description:
          "選んだデザインのまま見積もり依頼できるサイト内フォームを検討中です。",
      },
    ],
    documentation: {
      architectureHtmlUrl: "/projects/cutting-works-architecture.html",
    },
  },
  {
    slug: "discord-role-bot",
    title: "Discord 自己紹介認証Bot",
    description: "自己紹介で認証するDiscord Bot。自宅サーバー × CI/CDで実運用",
    detailedDescription:
      "新規参加者が認証ボタンからモーダルに入力すると、ロールを自動付与するBot。手動承認をなくし、参加障壁を下げました。自宅のRaspberry Piで稼働し、管理ログはDBを使わず管理チャンネルにEmbedで保存します。",
    image: "/projects/discord.png",
    githubUrl: "https://github.com/EricKei2002/role-bot-ts",
    tags: ["Node.js", "Discord.js", "TypeScript"],
    techStack: [
      { name: "Runtime: Node.js" },
      { name: "Library: Discord.js" },
      { name: "Language: TypeScript" },
      { name: "Infrastructure: Raspberry Pi 4 (Ubuntu)" },
      { name: "Container: Docker" },
      { name: "Test: Vitest" },
    ],
    challenges: [
      {
        title: "安定稼働とエラーハンドリング",
        description:
          "Docker、例外処理、自動再接続で、瞬断やレート制限に耐える24時間365日の稼働を実現しました。",
      },
      {
        title: "デプロイの自動化",
        description:
          "GitHub ActionsのCI/CDで、mainへのプッシュから自動テスト・デプロイします。",
      },
      {
        title: "ロジックの品質保証",
        description:
          "VitestでDiscord APIに依存せず認証ロジックを単体テストし、保守性を高めました。",
      },
    ],
    improvements: [
      {
        title: "設定のWebダッシュボード化",
        description:
          "対象チャンネルや付与ロールをブラウザで変更できるようにしたいです。",
      },
      {
        title: "複数サーバー対応",
        description:
          "DB（MongoDB等）に設定を保存し、複数サーバーへの導入を計画中です。",
      },
    ],
    documentation: {
      architectureHtmlUrl: "/projects/discord-role-bot-architecture.html",
    },
  },
  {
    slug: "burst-style",
    title: "Burst Style",
    description:
      "「宇宙への旅」をコンセプトに、Three.jsと映像演出を駆使した没入型ポートフォリオSPA。",
    detailedDescription:
      "「宇宙への旅」がテーマのポートフォリオ。Three.jsの3D演出に加え、Zustandで全画面ワープとページ遷移を同期し、シェーダーが画面を覆う間にページを切り替え、抜けると移動先が現れます。Cloudflare Turnstileのスパム対策やResendの自動返信など、裏側の体験にもこだわりました。",
    image: "/og/burst-style-card",
    siteUrl: "https://www.burst.style",
    githubUrl: "https://github.com/EricKei2002/burst-style",
    tags: ["Next.js", "Three.js", "Tailwind CSS", "React"],
    techStack: [
      { name: "Framework: Next.js 16 (App Router)" },
      { name: "3D Library: Three.js / @react-three/fiber" },
      { name: "State Management: Zustand" },
      { name: "Backend: Next.js API Routes" },
      { name: "Security: Cloudflare Turnstile" },
      { name: "Email: Resend API" },
      { name: "Asset: Video & Generated AI Images" },
    ],
    challenges: [
      {
        title: "シームレスな遷移と状態管理",
        description:
          "Zustand（`useTransitionStore`）で`router.push`とシェーダー再生を同期し、読み込みを感じさせない移動を実現。WebGL非対応や動きを減らす設定では、ワープを省きます。",
      },
      {
        title: "物語性のあるAPI/コンタクト機能",
        description:
          "サーバーレス関数でTurnstile認証、Formspree通知、Resend自動返信を処理。返信メールは宇宙船コンソール風で、世界観が続きます。",
      },
      {
        title: "パフォーマンスとビジュアルの両立",
        description:
          "Three.js / React Three Fiberの惑星は、端末性能に応じて解像度・フレームレート・影を調整し、画面外やタブ非表示では停止。遷移シェーダーは操作の兆しで読み込み、初期表示を軽くしています。",
      },
    ],
    improvements: [
      {
        title: "インタラクティブ性の向上",
        description:
          "マウスやスクロールに3D空間がより反応する演出を検討中です。",
      },
      {
        title: "国際化（i18n）対応",
        description: "日英切り替えは公開済み。今後は表現を磨きます。",
      },
    ],
    documentation: {
      architectureHtmlUrl: "/projects/burst-style-architecture.html",
    },
  },
];
