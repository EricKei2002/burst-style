"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { preloadShaderTransition } from "../../lib/shaderTransitionLoader";
import { beginLeaveTransition, useTransitionStore } from "../../lib/store";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
};

/**
 * ワープで覆ってから移動する内部リンク（サーバーコンポーネントの 404 などから使う）。
 * 新しいタブ・修飾キー付きのクリックは普通のリンクのまま。
 */
export default function WarpLink({ href, className, children }: Props) {
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }
    e.preventDefault();
    preloadShaderTransition();
    void beginLeaveTransition().then((navigateDelayMs) => {
      window.setTimeout(() => {
        useTransitionStore.getState().setPhase("closed");
        router.push(href);
      }, navigateDelayMs);
    });
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      onPointerEnter={() => preloadShaderTransition()}
      onFocus={() => preloadShaderTransition()}
      className={className}
    >
      {children}
    </Link>
  );
}
