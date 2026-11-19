/**
 * 格納庫（Projects の惑星）で、展示物の看板が選ばれたときに window へ流すイベント名。
 * detail: { slug }。PlanetInterior が流し、Projects が受けて詳細への遷移を始める。
 */
export const HANGAR_EXHIBIT_EVENT = "hangar-exhibit-open";

export type HangarExhibitDetail = { slug: string };
