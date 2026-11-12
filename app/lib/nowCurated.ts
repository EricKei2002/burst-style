// 「Now Building」に固定表示する作品（GitHub API とは別ソース）。

export type NowCuratedId = "saa-drill" | "liveai";

export type NowCuratedMeta = {
  id: NowCuratedId;
  /** タイトル行のリンク先。非公開などリンクなしのときは null */
  href: string | null;
  /** 右上の # バッジ（技術タグ）。非公開のみのときは null */
  techBadge: string | null;
  status: "private" | null;
  /** 相対時刻表示用（ISO 8601） */
  updatedAt: string;
  /** GitHub の recently pushed 一覧から除外するリポジトリ名（重複防止） */
  excludeGithubRepoName?: string;
};

export const NOW_CURATED_META: readonly NowCuratedMeta[] = [
  {
    id: "saa-drill",
    href: "https://drill.burst.style",
    techBadge: "Next.js",
    status: null,
    updatedAt: "2026-03-15T12:00:00.000Z",
    excludeGithubRepoName: "saa-drill",
  },
  {
    id: "liveai",
    href: null,
    techBadge: null,
    status: "private",
    updatedAt: "2026-02-01T09:00:00.000Z",
  },
] as const;

export const GITHUB_REPO_NAMES_EXCLUDED_FROM_NOW = new Set(
  NOW_CURATED_META.flatMap((item) =>
    item.excludeGithubRepoName
      ? [item.excludeGithubRepoName.toLowerCase()]
      : [],
  ),
);
