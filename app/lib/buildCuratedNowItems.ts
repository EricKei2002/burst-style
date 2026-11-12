import { NOW_CURATED_META, type NowCuratedId } from "./nowCurated";
import { buildSiteCopy, type Locale } from "./siteCopy";
import type { NowItem } from "./nowTypes";

export function buildCuratedNowItems(locale: Locale): NowItem[] {
  const copy = buildSiteCopy(locale);

  return NOW_CURATED_META.map((meta) => {
    const text = copy.now.curated[meta.id as NowCuratedId];
    const badge =
      meta.status === "private"
        ? copy.now.privateBadge
        : meta.techBadge
          ? meta.techBadge
          : null;

    return {
      id: `curated:${meta.id}`,
      name: text.name,
      href: meta.href,
      badge,
      summary: text.summary,
      summaryHref: null,
      date: meta.updatedAt,
    };
  });
}
