"use client";

import { Component, type ReactNode } from "react";

/**
 * R3F の <Canvas> は WebGL コンテキストを作れないと例外を投げ直す。
 * 受け止めないとページ全体が落ちるので、すべての <Canvas> をこれで包む。
 * 失敗したら何も描かない（下の背景や画像がそのまま見える）。
 */
export default class CanvasBoundary extends Component<
  { onError?(): void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
