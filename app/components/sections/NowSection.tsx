import { getNow } from "../../lib/now";
import NowSectionView, { type NowItem } from "./NowSectionView";

// GitHub から取得した直近のリポジトリを「Now Building」として表示する。
// 取得失敗・0件のときはセクションごと出さない。
export default async function NowSection() {
  const { status, repos, updatedAt } = await getNow();
  if (status !== "ok") return null;

  const items: NowItem[] = repos.map((repo) => {
    const latest = repo.commits[0];
    return {
      name: repo.name,
      url: repo.url,
      language: repo.language,
      commitMessage: latest?.message ?? null,
      commitUrl: latest?.url ?? null,
      date: latest?.date || repo.pushedAt,
    };
  });

  // 相対時刻はレンダリング時点（getNow の updatedAt）を基準にする。
  // ISR で最大10分ずれるのは許容。クライアントでも同じ基準時刻を使い、
  // ハイドレーションの不一致を防ぐ
  return <NowSectionView items={items} renderedAt={Date.parse(updatedAt)} />;
}
