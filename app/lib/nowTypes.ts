export type NowItem = {
  id: string;
  name: string;
  href: string | null;
  badge: string | null;
  summary: string | null;
  summaryHref: string | null;
  /** 相対時刻表示用。取得できない場合は null */
  date: string | null;
};
