// GitHub の直近の公開リポジトリとコミットを取得する共有ロジック。
// GET /api/now とトップページの「今作っているもの」セクションの両方から使う。
// fetch に next.revalidate を付けているため、同じURLへのリクエストは
// Next のデータキャッシュで共有され、GitHub API への呼び出しは重複しない。

const GITHUB_API = "https://api.github.com";
const GITHUB_USER = "EricKei2002";
const REPO_LIMIT = 5;
const COMMITS_PER_REPO = 3;
const REQUEST_TIMEOUT_MS = 8000;

export const NOW_REVALIDATE_SECONDS = 600;

export type NowStatus = "ok" | "empty" | "error";

export type NowCommit = {
  sha: string;
  message: string;
  url: string;
  date: string;
};

export type NowRepo = {
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  language: string | null;
  pushedAt: string;
  commits: NowCommit[];
};

export type NowResponse = {
  status: NowStatus;
  updatedAt: string;
  repos: NowRepo[];
};

type GitHubRepo = {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  pushed_at: string;
};

type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { date?: string } | null;
    committer: { date?: string } | null;
  };
};

function githubFetch(path: string): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "burst-style",
    },
    next: { revalidate: NOW_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

async function fetchRepos(): Promise<GitHubRepo[]> {
  const res = await githubFetch(
    `/users/${GITHUB_USER}/repos?sort=pushed&per_page=${REPO_LIMIT}`,
  );
  if (!res.ok) {
    throw new Error(`GitHub repos request failed: ${res.status}`);
  }
  return res.json();
}

async function fetchCommits(fullName: string): Promise<NowCommit[]> {
  const res = await githubFetch(
    `/repos/${fullName}/commits?per_page=${COMMITS_PER_REPO}`,
  );
  // コミットが1件もない空リポジトリはGitHubが409を返す（障害ではない）
  if (res.status === 409) {
    return [];
  }
  if (!res.ok) {
    throw new Error(`GitHub commits request failed: ${res.status}`);
  }

  const commits: GitHubCommit[] = await res.json();
  return commits.map(({ sha, html_url, commit }) => ({
    sha,
    message: commit.message.split("\n", 1)[0],
    url: html_url,
    date: commit.committer?.date ?? commit.author?.date ?? "",
  }));
}

/** 失敗時も throw せず status: "error" を返す */
export async function getNow(): Promise<NowResponse> {
  const updatedAt = new Date().toISOString();

  try {
    const repos = await fetchRepos();
    const nowRepos = await Promise.all(
      repos.map(
        async (repo): Promise<NowRepo> => ({
          name: repo.name,
          fullName: repo.full_name,
          url: repo.html_url,
          description: repo.description,
          language: repo.language,
          pushedAt: repo.pushed_at,
          commits: await fetchCommits(repo.full_name),
        }),
      ),
    );

    return {
      status: nowRepos.length > 0 ? "ok" : "empty",
      updatedAt,
      repos: nowRepos,
    };
  } catch (error) {
    console.error("Now API Error:", error);
    return { status: "error", updatedAt, repos: [] };
  }
}
