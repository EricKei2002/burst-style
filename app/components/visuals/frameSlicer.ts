/**
 * 重い初期化（ジオメトリ・テクスチャ生成、WebGL の準備）を小さなタスクに分けて実行する。
 *
 * - 先読み（低優先）: requestIdleCallback の空き時間だけで進める。ラボ計測（Lighthouse）でも
 *   50ms を超える長いタスクを作らない
 * - 急ぎ（ポインターがメニューに乗った・押した・フォーカスした）: MessageChannel で
 *   次のタスクへすぐ譲り、描画と入力の合間を空けつつ最短で終わらせる
 *
 * 生成処理はジェネレーター（`yield` で区切る）で書き、run() に渡す。
 * 同期で欲しい呼び出し元のために drain() もある。
 */

export class SliceCancelled extends Error {
  constructor() {
    super("slice cancelled");
    this.name = "SliceCancelled";
  }
}

/** 1 回のタスクで使ってよい時間（ms）。4 倍減速のラボ計測でも 50ms 未満に収める */
const SLICE_BUDGET_MS = 8;
/** 空き時間が短すぎるときでも最低これだけは進める */
const MIN_IDLE_SLICE_MS = 3;

export class FrameSlicer {
  private sliceEnd = 0;
  private urgent: boolean;
  private cancelled = false;
  private wake: (() => void) | null = null;
  private idleHandle = 0;
  private channel: MessageChannel | null = null;

  constructor(opts: { urgent?: boolean } = {}) {
    this.urgent = opts.urgent ?? false;
    this.sliceEnd = performance.now() + SLICE_BUDGET_MS;
  }

  get isUrgent(): boolean {
    return this.urgent;
  }

  /** 先読み中に操作の意図が来たら急ぎに切り替える（待機中の空き時間待ちも打ち切る） */
  setUrgent(): void {
    if (this.urgent) return;
    this.urgent = true;
    if (this.wake) {
      if (this.idleHandle && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(this.idleHandle);
      }
      this.idleHandle = 0;
      const wake = this.wake;
      this.wake = null;
      this.sliceEnd = performance.now() + SLICE_BUDGET_MS;
      wake();
    }
  }

  cancel(): void {
    this.cancelled = true;
    if (this.idleHandle && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(this.idleHandle);
    }
    this.idleHandle = 0;
    const wake = this.wake;
    this.wake = null;
    wake?.();
    if (this.channel) {
      this.channel.port1.onmessage = null;
      this.channel.port1.close();
      this.channel = null;
    }
  }

  get isCancelled(): boolean {
    return this.cancelled;
  }

  /** 今のタスクの持ち時間を使い切ったか */
  due(): boolean {
    return performance.now() >= this.sliceEnd;
  }

  /** 持ち時間を使い切っていれば次のタスクへ譲る */
  async step(): Promise<void> {
    if (this.cancelled) throw new SliceCancelled();
    if (this.due()) await this.pause();
  }

  /** 必ず次のタスクへ譲る（WebGL の重い 1 手の前後など） */
  async pause(): Promise<void> {
    if (this.cancelled) throw new SliceCancelled();
    await new Promise<void>((resolve) => {
      this.wake = resolve;
      if (!this.urgent && typeof window.requestIdleCallback === "function") {
        this.idleHandle = window.requestIdleCallback((deadline) => {
          this.idleHandle = 0;
          if (this.wake !== resolve) return;
          this.wake = null;
          this.sliceEnd =
            performance.now() +
            Math.max(
              MIN_IDLE_SLICE_MS,
              Math.min(SLICE_BUDGET_MS, deadline.timeRemaining()),
            );
          resolve();
        });
        return;
      }
      this.postTask(() => {
        if (this.wake !== resolve) return;
        this.wake = null;
        this.sliceEnd = performance.now() + SLICE_BUDGET_MS;
        resolve();
      });
    });
    if (this.cancelled) throw new SliceCancelled();
  }

  /** ジェネレーターを持ち時間ごとに区切って最後まで進め、戻り値を返す */
  async run<T>(gen: Generator<void, T, unknown>): Promise<T> {
    try {
      for (;;) {
        if (this.cancelled) throw new SliceCancelled();
        const r = gen.next();
        if (r.done) return r.value;
        if (this.due()) await this.pause();
      }
    } catch (error) {
      // 打ち切り時はジェネレーターの finally（作りかけの片付け）を走らせる
      gen.return(undefined as T);
      throw error;
    }
  }

  private postTask(fn: () => void): void {
    // setTimeout(0) の 4ms 下限を避ける
    if (typeof MessageChannel === "function") {
      if (!this.channel) this.channel = new MessageChannel();
      this.channel.port1.onmessage = () => fn();
      this.channel.port2.postMessage(0);
      return;
    }
    window.setTimeout(fn, 0);
  }
}

/** ジェネレーターを同期で最後まで回す（分割しない呼び出し元用） */
export function drain<T>(gen: Generator<void, T, unknown>): T {
  for (;;) {
    const r = gen.next();
    if (r.done) return r.value;
  }
}
