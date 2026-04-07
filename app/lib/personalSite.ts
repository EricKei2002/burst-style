/** ホームの Now / Lab / Writing 用。文言やリンクはここを編集してください。 */

export interface NowEntry {
  text: string;
  /** 強調表示（最後の一文など） */
  highlight?: boolean;
}

export const nowData = {
  /** 表示用（例: 2026-04-07） */
  updated: "2026-04-07",
  /** セクション見出し下の短いリード */
  lead: "本業と個人プロジェクトのバランスを取りながら、このサイトで実験と記録を積み上げています。",
  entries: [
    {
      text: "フロントエンドを軸に、AI・インフラ寄りの学習も継続中。週末は自宅サーバや小さめのUI実験に時間を使うことが多いです。",
    },
    {
      text: "Burst Style は「個人の活動ログ」と「遊び場」として育てる予定です。更新は気長にお付き合いください。",
      highlight: true,
    },
  ] as NowEntry[],
  disclaimer:
    "このサイトに掲載する内容は個人の見解であり、所属する組織の公式見解を代表するものではありません。",
};

export type LabLink =
  | { kind: "hash"; id: string }
  | { kind: "project"; slug: string };

export interface LabItem {
  title: string;
  description: string;
  tags: string[];
  link: LabLink;
  ctaLabel: string;
}

export const labData: LabItem[] = [
  {
    title: "C# 電卓（ブラウザ版）",
    description:
      "About タイムライン内でそのまま操作できるミニデモ。学習初期のノスタルジアを UI に落とし込んだ実験です。",
    tags: ["C#", "UI", "Demo"],
    link: { kind: "hash", id: "about-lab-csharp" },
    ctaLabel: "デモへジャンプ",
  },
  {
    title: "Todo + TypeScript",
    description:
      "型安全な React パターンの学習用ウィジェット。状態管理とコンポーネント分割の練習台です。",
    tags: ["TypeScript", "React"],
    link: { kind: "hash", id: "about-lab-todo" },
    ctaLabel: "デモへジャンプ",
  },
  {
    title: "Burst Style（本サイト）",
    description:
      "Next.js とビジュアル表現の実験場。遷移・スクロール・3D など、ポートフォリオ自体が作品になっています。",
    tags: ["Next.js", "Creative"],
    link: { kind: "project", slug: "burst-style" },
    ctaLabel: "ケーススタディ",
  },
];

export interface WritingItem {
  title: string;
  description: string;
  badge: string;
  /** 未設定のときはカードは情報表示のみ（リンクなし） */
  href?: string;
  hrefLabel?: string;
}

export const writingData: WritingItem[] = [
  {
    title: "GitHub",
    description: "リポジトリ・細かな実験コード・学習ログの置き場です。",
    badge: "Code",
    href: "https://github.com/EricKei2002",
    hrefLabel: "プロフィールを開く",
  },
  {
    title: "Articles",
    description:
      "Zenn / note などで記事を公開したら、ここからリンクを貼っていく予定です。",
    badge: "Writing",
  },
];
