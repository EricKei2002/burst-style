// 「Now Building」に固定表示する作品（GitHub API とは別ソース）。

export type NowCuratedId = "saa-drill" | "liveai";

export type NowCuratedMeta = {
  id: NowCuratedId;
  /** タイトル行のリンク先。非公開などリンクなしのときは null */
  href: string | null;
  /** 右上の # バッジ（技術タグ）。非公開のみのときは null */
  techBadge: string | null;
  status: "private" | null;
  /** 公開リポジトリの pushed_at 取得用 */
  githubRepoFullName?: string;
  /** GITHUB_TOKEN があれば pushed_at を取得する非公開リポジトリ */
  privateGithubRepoFullName?: string;
  /** GitHub の recently pushed 一覧カードから除外（curated で表示するため） */
  excludeGithubRepoName?: string;
};

export const NOW_CURATED_META: readonly NowCuratedMeta[] = [
  {
    id: "saa-drill",
    href: "https://github.com/EricKei2002/saa-drill",
    techBadge: "TypeScript",
    status: null,
    githubRepoFullName: "EricKei2002/saa-drill",
    excludeGithubRepoName: "saa-drill",
  },
  {
    id: "liveai",
    href: null,
    techBadge: null,
    status: "private",
    privateGithubRepoFullName: "EricKei2002/liveai",
  },
] as const;

export const GITHUB_REPO_NAMES_EXCLUDED_FROM_NOW = new Set(
  NOW_CURATED_META.flatMap((item) =>
    item.excludeGithubRepoName
      ? [item.excludeGithubRepoName.toLowerCase()]
      : [],
  ),
);
