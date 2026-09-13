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
    architectureMermaid: string;
    architectureHtmlUrl?: string;
  };
}

export const projectsData: Project[] = [
  {
    slug: "学習アプリ",
    title: "AWS学習アプリ",
    description:
      "AWS認定試験対策のための毎日10問ドリル。Googleログイン＋Supabaseで進捗を端末間同期、PWA対応。",
    detailedDescription:
      "AWS Certified Solutions Architect – Associate 合格を目指す、毎日10問形式の学習PWAです。セキュリティ3・可用性3・性能2・コスト2という配点比率に沿って出題ドメインを配分し、「未見→誤答→似た論点→古い」の優先順位で決定論的に10問を選出します。解答直後にその場で解説と「持ち帰る一文」を表示し、間違えた論点は弱点データとして記録して弱点ドリル（練習専用画面）で優先的に再出題する設計です（かつてあった復習タブは廃止し、弱点ドリルに導線を一本化）。Googleログイン（Supabase Auth）で連続学習日数・ドメイン別正答率・試験日カウントダウンをアカウントに紐づけて保存し、スマホと自宅PCなど複数端末で同じ記録を引き継げます。学習タブでは略称（IAM、ALBなど）をタップすると正式名称と意味がその場で開くグロッサリー機能も搭載。ユーザーが自分のGemini APIキーを設定すると、AWS公式の最新情報（What's New RSS）も踏まえて弱点分野の問題をその場でAI生成でき、Vercel Cronが毎朝事前生成もしておくため学習時の待ち時間がありません。夜21時にはWeb Push（VAPID）で日課の未消化をリマインドします。問題は公式試験問題の複製ではなく、AWS公式ドキュメント等を根拠にしたオリジナル演習です。",
    image: "/projects/saa-drill.png",
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
          "日付文字列をシードにしたハッシュ関数で疑似乱数を生成し、同じ日にアプリを開き直しても同じ10問が出るようにしました。出題は「未出題→誤答率が高い→似た論点→出題から日数が経っている」の優先順位で並べ替えてから抽選することで、弱点補強と新規学習のバランスを取っています。",
      },
      {
        title: "未ログイン進捗とアカウントの引き継ぎ",
        description:
          "ログイン前でもすぐ学習を始められるよう、Googleログイン直前まではsessionStorageに進捗を退避し、ログイン完了と同時にSupabase側のRPC（fetch_progress / push_progress）へマージする設計にしました。これにより「まず10問解いてから、気に入ったらログイン」という体験を崩さずに端末間同期を実現しています。",
      },
    ],
    improvements: [
      {
        title: "AWS以外の学習分野への展開",
        description:
          "Gemini APIを使った弱点分野のパーソナライズ出題エンジンを汎用化し、AWS以外の資格・学習分野でも使えるAI機能を追加していきたいと考えています。",
      },
      {
        title: "学習分析の強化",
        description:
          "ドメイン別正答率に加えて、時間帯別の得意不得意や、間違えた論点同士の関連性を可視化するダッシュボードを検討しています。",
      },
    ],
    documentation: {
      architectureHtmlUrl: "/projects/saa-drill-architecture.html",
      architectureMermaid: `graph TD
    Browser["ブラウザ / PWA<br/>Next.js App Router UI"]
    SW["Service Worker<br/>オフライン / Push受信"]

    SupaAuth["Supabase Auth<br/>Google OAuth (PKCE)"]
    Postgres[("Supabase Postgres<br/>progress / push_subscriptions")]
    PushService["ブラウザPushサービス<br/>Web Push (VAPID)"]

    GenAPI["/api/generate-questions<br/>Vercel Function"]
    PushAPI["/api/push/subscribe<br/>Vercel Function"]
    GenCore["問題生成ロジック<br/>gemini-generate.ts（共通）"]

    subgraph Cron ["Vercel Cron（CRON_SECRET認証）"]
        CronPool["cron: prepare-ai-pools<br/>毎日 05:00 JST"]
        CronReminder["cron: daily-reminder<br/>毎日 21:00 JST"]
    end

    Gemini["Google Gemini API<br/>@google/genai"]
    RSS["AWS What's New RSS<br/>5分キャッシュ"]

    Browser -->|① Googleログイン PKCE, anon key| SupaAuth
    Browser -->|② 進捗の取得/保存 anon key, RPC| Postgres
    Browser -->|③ AI問題生成（自分のGeminiキー）| GenAPI
    Browser -->|④ Push購読 登録/解除 JWT| PushAPI

    GenAPI --> GenCore
    PushAPI -->|JWT検証 Supabase Admin| SupaAuth
    PushAPI -->|購読情報を保存 service role| Postgres

    CronPool -->|⑤ 対象ユーザー抽出→結果保存 service role| Postgres
    CronPool --> GenCore
    CronReminder -->|⑥ 未完了ユーザー抽出 service role| Postgres
    CronReminder -->|VAPID署名付きWeb Push送信| PushService

    GenCore -->|Gemini API 呼び出し| Gemini
    GenCore -.->|新着情報を取得| RSS

    PushService -->|Push配信| SW
    SW -->|通知表示 → /todayへ遷移| Browser
`,
    },
  },
  {
    slug: "sonta-kun",
    title: "Sontaくん",
    description: "空気を読む、AI日程調整ツール",
    detailedDescription:
      "「何も言わなくても、良きに計らっておきました」というAIの振る舞いを表現した、日本独特の文化「忖度（そんたく）」から生まれたAI日程調整エージェント。Google Geminiを活用して自然言語の「ふんわりした希望」から制約条件を読み取り、Googleカレンダーの空き状況と照らし合わせて最適な日時を提案します。",
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
          "「来週の午後早め」といった曖昧な表現を、Google Gemini APIを用いて具体的な日時範囲（ISO文字列等）に変換する「忖度エンジン」を開発。プロンプトエンジニアリングにより、文脈を汲み取った精度の高い抽出を実現しました。",
      },
      {
        title: "シームレスな外部連携",
        description:
          "Google Calendar、Zoom、Resendといった複数の外部サービスをServer Actions内で統合。トークン管理やエラーハンドリングを徹底し、ユーザーが裏側の複雑さを感じることなく、ワンストップで調整が完了する体験を構築しました。",
      },
    ],
    improvements: [
      {
        title: "「気遣い」ロジックの強化",
        description:
          "単なる空き枠ではなく、前後の移動時間や昼休み時間を考慮した「本当に嬉しい提案」ができるよう、アルゴリズムを改良予定です。",
      },
      {
        title: "マルチモーダル・複数人対応",
        description:
          "複数人のカレンダー同期や、チャットボット形式以外でのインターフェース拡充を検討しています。",
      },
    ],
    documentation: {
      architectureHtmlUrl: "/projects/sonta-kun-architecture.html",
      architectureMermaid: `graph TD
    subgraph Client ["クライアントサイド "]
        Browser[ユーザーブラウザ]
    end

    subgraph Hosting ["Vercel ホスティング"]
        NextJS["Next.js アプリ (App Router)"]
        
        subgraph ServerActions ["サーバーアクション / API"]
            AuthService["認証サービス"]
            SontakuEngine["忖度エンジン (空き状況ロジック)"]
            GeminiClient["Gemini クライアント (制約抽出)"]
            CalendarService["Google カレンダーサービス"]
            ZoomService["Zoom サービス"]
            EmailService["メールサービス (Resend)"]
        end
    end

    subgraph Database ["データベース (Supabase)"]
        SupabaseAuth["Supabase 認証"]
        Postgres["PostgreSQL データベース"]
        
        Tables[("テーブル:
        - interviews
        - interview_tokens
        - availabilities")]
    end

    subgraph External ["外部サービス"]
        GoogleGemini["Google Gemini API"]
        GoogleCal["Google Calendar API"]
        GoogleMeet["Google Meet API"]
        ZoomAPI["Zoom API"]
        ResendAPI["Resend API"]
    end

    %% フロー
    Browser -->|HTTPS| NextJS
    NextJS -->|Server Actions| ServerActions
    
    AuthService --> SupabaseAuth
    
    SontakuEngine -->|空き状況取得| CalendarService
    SontakuEngine -->|制約抽出| GeminiClient
    GeminiClient -->|プロンプト: 自然言語| GoogleGemini
    GoogleGemini -->|JSON: 制約データ| GeminiClient
    
    CalendarService -->|イベント読み書き| GoogleCal
    GoogleCal -.->|会議リンク生成| GoogleMeet
    
    ZoomService -->|ミーティング作成| ZoomAPI
    EmailService -->|通知送信| ResendAPI
    
    ServerActions -->|データ読み書き| Postgres
    Postgres --- Tables

    %% スタイル定義 (クラス)
    classDef primary fill:#2563eb,stroke:#1d4ed8,color:#fff;
    classDef secondary fill:#4b5563,stroke:#374151,color:#fff;
    classDef external fill:#10b981,stroke:#059669,color:#fff;
    classDef db fill:#f59e0b,stroke:#d97706,color:#fff;

    class NextJS,SontakuEngine primary;
    class GeminiClient,CalendarService,ZoomService,EmailService secondary;
    class GoogleGemini,GoogleCal,GoogleMeet,ZoomAPI,ResendAPI external;
    class Postgres,SupabaseAuth,Tables db;


`,
    },
  },
  {
    slug: "cutting-works",
    title: "Cutting Works",
    description:
      "多彩なカッティングステッカー・デザインサイト制作。ユーザーが直感的にデザインを選べるUIと、制作実績のギャラリー機能を実装。",
    detailedDescription:
      "カッティングステッカーの制作・販売を行う「Cutting Works」の公式ウェブサイトです。ユーザーが豊富なデザインカタログから直感的に好みのステッカーを選べるよう、視覚的に優れたギャラリーUIを構築しました。制作実績はNext.jsのビルド時に読み込む静的なTypeScriptデータ（app/data/works.ts）として管理し、画像はnext/imageで最適化配信することで、CMSを介さずシンプルかつ高速な構成にしています。お問い合わせはmailtoリンク経由です。",
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
          "数多くのステッカー画像をギャラリーとして表示するため、ページの読み込み速度が課題となりました。Next.jsのImageコンポーネントを適切に設定し、WebPフォーマットへの変換や遅延読み込みを活用することで、高画質を維持したままCore Web Vitalsの数値を改善しました。",
      },
      {
        title: "シンプルな静的構成による運用",
        description:
          "制作実績の更新頻度がそれほど高くないことを踏まえ、CMSは導入せずapp/data/works.tsの静的配列で管理する構成にしました。デプロイのたびにVercelが再ビルドするだけで反映されるため、外部サービスへの依存や管理画面の学習コストなしに、Gitでの変更履歴管理と両立できています。",
      },
    ],
    improvements: [
      {
        title: "検索・フィルタリング機能の強化",
        description:
          "ステッカーの種類やカテゴリが増えた際に、ユーザーが目的のデザインに素早く辿り着けるよう、インスタントサーチ機能の実装を計画しています。",
      },
      {
        title: "お問い合わせ体験の改善",
        description:
          "現在はmailtoリンクでメールアプリを起動する形ですが、お気に入りのデザインを選択した状態でスムーズに見積もり依頼が出せるよう、サイト内でのフォーム実装を検討しています。",
      },
    ],
    documentation: {
      architectureHtmlUrl: "/projects/cutting-works-architecture.html",
      architectureMermaid: `graph TD
    User[ユーザー / クライアント] -->|ギャラリー閲覧| NextJS[Next.js App Router]
    NextJS -->|コンテンツ取得| MicroCMS[MicroCMS API]
    NextJS -->|静的アセット配信| Vercel[Vercel CDN]
    Admin[管理者 / クライアント] -->|コンテンツ更新| MicroCMS
`,
    },
  },
  {
    slug: "discord-role-bot",
    title: "Discord 自己紹介認証Bot",
    description:
      "コミュニティ運営を効率化する自己紹介認証Discord Bot。自宅サーバー × CI/CD による実運用経験",
    detailedDescription:
      "Discordコミュニティにおいて、新規参加者が認証ボタンをクリックし、表示されるモーダル（フォーム）に必要事項を入力して送信することで、自動的に特定のロール（権限）を付与するBotアプリケーションです。これにより、管理者の手動承認の手間を省き、コミュニティへの参加障壁を下げることに成功しました。自宅のRaspberry Piサーバー上で稼働させています。また、管理ログ（成功/失敗）はデータベースを使用せず、管理チャンネルにEmbed形式で保存する設計を採用しています。",
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
          "24時間365日稼働させる必要があるため、ネットワークの瞬断やAPIのレート制限に対する堅牢性が求められました。Dockerを用いたコンテナ管理の導入や、適切な例外処理と自動再接続ロジックを実装することで、長期間の安定稼働を実現しました。",
      },
      {
        title: "デプロイの自動化",
        description:
          "開発環境から自宅サーバーへのデプロイを手動で行うのは手間であり、ミスも発生しやすいため、GitHub Actionsを用いたCI/CDパイプラインを構築しました。mainブランチへのプッシュをトリガーに自動的にテストとデプロイが行われるようになりました。",
      },
      {
        title: "ロジックの品質保証",
        description:
          "Botの認証ロジックなどのコア機能について、Discord APIに依存せず単体テストを行うためにVitestを導入しました。これにより、外部サービスの影響を受けずにロジックの正当性を検証できる環境を構築し、保守性を向上させました。",
      },
    ],
    improvements: [
      {
        title: "設定のWebダッシュボード化",
        description:
          "現在は設定ファイルで管理していますが、WebブラウザからBotの設定（対象チャンネルや付与するロール）を変更できるダッシュボード機能の実装を目指しています。",
      },
      {
        title: "複数サーバー対応",
        description:
          "現在は単一サーバー向けに最適化されていますが、複数のDiscordサーバーに導入できるよう、データベース（MongoDB等）を導入して設定を永続化する改修を計画しています。",
      },
    ],
    documentation: {
      architectureHtmlUrl: "/projects/discord-role-bot-architecture.html",
      architectureMermaid: `sequenceDiagram
    participant User as ユーザー
    participant API as Discord API
    participant Bot as Bot

    User->>API: 認証クリック
    API->>Bot: Button受信
    Bot->>API: モーダル表示
    User->>API: 送信
    API->>Bot: ModalSubmit
    alt 成功
        Bot->>API: Memberロール付与
        Bot->>User: 成功
    else 失敗
        Bot->>User: エラー
    end
`,
    },
  },
  {
    slug: "burst-style",
    title: "Burst Style",
    description:
      "没入型Web体験を追求した自身のポートフォリオサイト。「宇宙船への搭乗」をコンセプトに、Three.jsと映像演出を駆使したSPA。",
    detailedDescription:
      "「Burst Style」は、没入感あふれるビジュアル体験と堅牢なバックエンド設計を融合させたポートフォリオサイトです。「宇宙への旅」をテーマにしたThree.jsによる3D演出やシームレスな遷移アニメーションに加え、実用的な機能面も徹底しました。特にフロントエンドでは、Zustandを用いた軽量な状態管理により「ハンガードア」の開閉とページ遷移を完全に同期。左右非対称（シアン＆パープル）のドアが閉まることでローディングを隠し、シームレスに宇宙船内部へと移動する演出を実現しています。バックエンドでは、Cloudflare Turnstileによるスパム対策やResend APIを用いた自動返信メールなど、見えない部分の体験設計（User Experience）にもこだわっています。",
    image: "/projects/burst-style-card.jpg",
    siteUrl: "https://burst.style",
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
          "「ドアが閉まってからページが移動し、移動先でドアが開く」という一連のシーケンスを実現するために、Zustandを用いたグローバルな状態管理（`transition-store`）を導入しました。Next.jsの`router.push`による遷移タイミングとCSSアニメーションを厳密に同期させることで、ブラウザのロードを感じさせない没入感のある移動体験を作り出しています。",
      },
      {
        title: "物語性のあるAPI/コンタクト機能",
        description:
          "単なる「送信完了」ではなく、物語の一部としてのコンタクト機能を実装しました。Next.jsのサーバーレス関数内で、Turnstile認証（セキュリティ）、Formspree転送（通知）、Resend送信（自動返信）を一連のフローとして処理。特に自動返信メールは宇宙船のコンソールを模したHTMLデザインを採用し、サイトを離れた後も世界観が続くよう設計されています。",
      },
      {
        title: "パフォーマンスとビジュアルの両立",
        description:
          "Three.jsによるパーティクル描画と高解像度の背景動画を併用するため、描画負荷が課題となりました。コンポーネントの再レンダリング抑制に加え、初回アクセス時のみ「Boot Sequence」を実行するようセッションストレージで制御することで、リピート訪問時の快適性を向上させています。",
      },
    ],
    improvements: [
      {
        title: "インタラクティブ性の向上",
        description:
          "現在は背景演出がメインですが、ユーザーのマウス操作やスクロールに合わせて3D空間がよりダイナミックに反応するようなインタラクションの追加を検討しています。",
      },
      {
        title: "国際化（i18n）対応",
        description:
          "海外のビジターにもポートフォリオを見てもらえるよう、英語対応を含めた多言語化サポートの実装を計画しています。",
      },
    ],
    documentation: {
      architectureHtmlUrl: "/projects/burst-style-architecture.html",
      architectureMermaid: `graph TD
    User[ユーザー] --> Next[Next.js App]
    Next --> Client[Client Components]
    Client --> Store[Zustand]
    Client --> Three[Three.js]
    Client --> Video[動画背景]
    User --> Contact[Contact API]
    Contact --> Turnstile[Turnstile]
    Contact --> Formspree[Formspree]
    Contact --> Resend[Resend]
`,
    },
  },
];
