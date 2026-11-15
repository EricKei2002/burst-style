"use client";

import { useEffect } from "react";

/** ハッシュ付き URL で開いたとき、レイアウト確定後にアンカー先へ再スクロールする */
export default function HomeHashScrollAlign() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;

    let stopped = false;
    const align = () => {
      if (stopped) return;
      document.getElementById(id)?.scrollIntoView({ block: "start" });
    };
    const resizeObserver = new ResizeObserver(align);
    resizeObserver.observe(document.body);

    const stop = () => {
      stopped = true;
      resizeObserver.disconnect();
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
      clearTimeout(timer);
    };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);
    const timer = setTimeout(stop, 2500);
    align();

    return stop;
  }, []);

  return null;
}
