import { getNow, resolveCuratedPushedAt } from "../../lib/now";
import { GITHUB_REPO_NAMES_EXCLUDED_FROM_NOW } from "../../lib/nowCurated";
import type { NowItem } from "../../lib/nowTypes";
import NowSectionView from "./NowSectionView";

// GitHub から取得した直近のリポジトリを「Now Building」として表示する。
// 取得失敗・0件でも、固定の curated 項目があればセクションを表示する。
export default async function NowSection() {
  const { status, repos, updatedAt } = await getNow();
  const curatedPushedAt = await resolveCuratedPushedAt(repos);

  const githubItems: NowItem[] =
    status === "ok"
      ? repos
          .filter(
            (repo) =>
              !GITHUB_REPO_NAMES_EXCLUDED_FROM_NOW.has(repo.name.toLowerCase()),
          )
          .map((repo) => {
            const latest = repo.commits[0];
            return {
              id: `github:${repo.fullName}`,
              name: repo.name,
              href: repo.url,
              badge: repo.language,
              summary: latest?.message ?? null,
              summaryHref: latest?.url ?? null,
              date: latest?.date || repo.pushedAt,
            };
          })
      : [];

  return (
    <NowSectionView
      githubItems={githubItems}
      curatedPushedAt={curatedPushedAt}
      renderedAt={Date.parse(updatedAt)}
    />
  );
}
