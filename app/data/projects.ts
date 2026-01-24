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
  };
}

export const projectsData: Project[] = [
  {
    slug: "cutting-works",
    title: "Cutting Works",
    description: "多彩なカッティングステッカー・デザインサイト制作。ユーザーが直感的にデザインを選べるUIと、制作実績のギャラリー機能を実装。",
    detailedDescription: "カッティングステッカーの制作・販売を行う「Cutting Works」の公式ウェブサイトです。ユーザーが豊富なデザインカタログから直感的に好みのステッカーを選べるよう、視覚的に優れたギャラリーUIを構築しました。また、MicroCMSを導入することで、クライアント自身が手軽に制作実績やニュースを更新できる運用体制を整えています。",
    image: "/projects/bg cwb.jpeg",
    siteUrl: "https://cuttingworks.burst.style",
    githubUrl: "https://github.com/EricKei2002/cutting-works-burst",
    tags: ["Next.js", "MicroCMS", "Tailwind CSS"],
    techStack: [
      { name: "Framework: Next.js (App Router)" },
      { name: "CMS: MicroCMS" },
      { name: "Styling: Tailwind CSS" },
      { name: "Language: TypeScript" },
      { name: "Hosting: Vercel" }
    ],
    challenges: [
      {
        title: "画像中心のパフォーマンス最適化",
        description: "数多くのステッカー画像をギャラリーとして表示するため、ページの読み込み速度が課題となりました。Next.jsのImageコンポーネントを適切に設定し、WebPフォーマットへの変換や遅延読み込みを活用することで、高画質を維持したままCore Web Vitalsの数値を改善しました。"
      },
      {
        title: "運用負荷の軽減",
        description: "以前はエンジニアがコードを修正してコンテンツを更新していましたが、更新頻度を高めるためにMicroCMSを導入。非技術者であるクライアントでも直感的に記事を入稿できる管理画面を設計し、運用フローを大幅に簡素化しました。"
      }
    ],
    improvements: [
      {
        title: "検索・フィルタリング機能の強化",
        description: "ステッカーの種類やカテゴリが増えた際に、ユーザーが目的のデザインに素早く辿り着けるよう、インスタントサーチ機能の実装を計画しています。"
      },
      {
        title: "注文フォームとの連携",
        description: "現在は外部フォームへ誘導していますが、お気に入りのデザインを選択した状態でスムーズに見積もり依頼が出せるよう、サイト内でのフォーム連携を検討しています。"
      }
    ],
    documentation: {
      architectureMermaid: `graph TD
    User[User / Client] -->|Browse Gallery| NextJS[Next.js App Router]
    NextJS -->|Fetch Content| MicroCMS[MicroCMS API]
    NextJS -->|Serve Static Assets| Vercel[Vercel CDN]
    Admin[Admin / Client] -->|Update Content| MicroCMS
`
    }
  },
  {
    slug: "discord-role-bot",
    title: "Discord 自己紹介認証Bot",
    description: "コミュニティ運営を効率化する自己紹介認証Discord Bot。自宅サーバー × CI/CD による実運用経験",
    detailedDescription: "Discordコミュニティにおいて、新規参加者が認証ボタンをクリックし、表示されるモーダル（フォーム）に必要事項を入力して送信することで、自動的に特定のロール（権限）を付与するBotアプリケーションです。これにより、管理者の手動承認の手間を省き、コミュニティへの参加障壁を下げることに成功しました。自宅のRaspberry Piサーバー上で稼働させています。また、管理ログ（成功/失敗）はデータベースを使用せず、管理チャンネルにEmbed形式で保存する設計を採用しています。",
    image: "/discord.png",
    githubUrl: "https://github.com/EricKei2002/role-bot-ts",
    tags: ["Node.js", "Discord.js", "TypeScript"],
    techStack: [
      { name: "Runtime: Node.js" },
      { name: "Library: Discord.js" },
      { name: "Language: TypeScript" },
      { name: "Infrastructure: Raspberry Pi 4 (Ubuntu)" },
      { name: "Container: Docker" },
      { name: "Test: Vitest" }
    ],
    challenges: [
      {
        title: "安定稼働とエラーハンドリング",
        description: "24時間365日稼働させる必要があるため、ネットワークの瞬断やAPIのレート制限に対する堅牢性が求められました。Dockerを用いたコンテナ管理の導入や、適切な例外処理と自動再接続ロジックを実装することで、長期間の安定稼働を実現しました。"
      },
      {
        title: "デプロイの自動化",
        description: "開発環境から自宅サーバーへのデプロイを手動で行うのは手間であり、ミスも発生しやすいため、GitHub Actionsを用いたCI/CDパイプラインを構築しました。mainブランチへのプッシュをトリガーに自動的にテストとデプロイが行われるようになりました。"
      },
      {
        title: "ロジックの品質保証",
        description: "Botの認証ロジックなどのコア機能について、Discord APIに依存せず単体テストを行うためにVitestを導入しました。これにより、外部サービスの影響を受けずにロジックの正当性を検証できる環境を構築し、保守性を向上させました。"
      }
    ],
    improvements: [
      {
        title: "設定のWebダッシュボード化",
        description: "現在は設定ファイルで管理していますが、WebブラウザからBotの設定（対象チャンネルや付与するロール）を変更できるダッシュボード機能の実装を目指しています。"
      },
      {
        title: "複数サーバー対応",
        description: "現在は単一サーバー向けに最適化されていますが、複数のDiscordサーバーに導入できるよう、データベース（MongoDB等）を導入して設定を永続化する改修を計画しています。"
      }
    ],
    documentation: {
      architectureMermaid: `sequenceDiagram
    participant User
    participant DiscordAPI
    participant Bot as Node.js Bot
    participant LogChannel

    User->>DiscordAPI: Click "Authenticate"
    DiscordAPI->>Bot: Interaction Create (Button)
    Bot->>DiscordAPI: Show Modal (Form)
    User->>DiscordAPI: Submit Form Data
    DiscordAPI->>Bot: Interaction Create (ModalSubmit)
    Bot->>Bot: Validate Inputs
    alt Valid
        Bot->>DiscordAPI: Assign "Member" Role
        Bot->>LogChannel: Send Success Embed
        Bot->>User: Reply Ephemeral "Success"
    else Invalid
        Bot->>User: Reply Ephemeral "Error"
    end
`
    }
  }
];
