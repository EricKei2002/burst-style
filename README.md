# Burst Style

Next.js (App Router) と Tailwind CSS で構築されたポートフォリオサイトです。`create-next-app` を叩いた雛形をベースに、`app` ディレクトリ内のレイアウトやコンポーネント (`Hero`, `Projects` など) を編集してコンテンツを更新します。

## 開発を始めるには

1. 依存関係をインストール
   ```bash
   bun install   # もしくは npm install / pnpm install
   ```
2. 開発サーバーを起動
   ```bash
   bun dev      # もしくは npm run dev
   ```
3. ブラウザで [http://localhost:3000](http://localhost:3000) を開き、変更結果を即時プレビューします。`app/page.tsx` に手を入れるとホットリロードで自動反映されます。

## 用意されているスクリプト

| コマンド | 役割 |
| --- | --- |
| `bun dev` | 開発サーバー (ホットリロード) |
| `bun run build` | 本番ビルドの作成 |
| `bun start` | ビルド済みアプリの実行 |
| `bun run lint` | ESLint による静的解析 |
| `bun run format` / `bun run format:check` | Prettier でコード整形 or 差分チェック |

※ npm / pnpm を使う場合は `bun` の部分を各パッケージマネージャーに置き換えてください。

## 開発のヒント

- フォントは [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) で [Geist](https://vercel.com/font) を自動読み込みしています。
- 新しいセクションやカードを追加する際は `app/components` 以下にコンポーネントを作り、`app/page.tsx` かレイアウトで読み込みます。

## 参考リンク

- [Next.js ドキュメント](https://nextjs.org/docs) – API や App Router の詳細
- [Next.js Learn](https://nextjs.org/learn) – 公式のインタラクティブ講座
- [Next.js GitHub](https://github.com/vercel/next.js) – Issue や PR の参照

## デプロイ

本番公開には [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) が最も簡単です。その他のホスティング先でも、`bun run build`（または `npm run build`）で生成される成果物をサーバーに配置し `start` コマンドで起動すれば動作します。詳しくは [Next.js デプロイドキュメント](https://nextjs.org/docs/app/building-your-application/deploying) を参照してください。
