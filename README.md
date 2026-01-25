# Burst Style - Portfolio Website

![Project Banner](public/projects/logo.jpg)

「Burst Style」は、没入感と物語性を重視した、私 (Eric Kei) のポートフォリオサイトです。
ウェブサイトを単なる情報の羅列ではなく、一つの「体験」として捉え、訪問者を宇宙への旅（創造性の探求）へと誘います。

Next.js 16 (App Router) のパフォーマンスと、Three.js / GSAP によるリッチなビジュアル表現を融合させた、モダンなシングルページアプリケーションです。

## 🚀 主な機能 (Features)

### 1. 没入型 3D 背景 (Immersive Visuals)

- **StarBackground (トップページ)**: Three.js を使用し、無数の星が流れるワープ空間（WarpStars）を描画。
- **Spaceship Interior (プロジェクト詳細)**: プロジェクトページへ移動すると、背景が「無限に続く宇宙船の通路（Infinite Video Loop）」へとシームレスに切り替わります。

### 2. シームレスな遷移 (Hangar Door Transition)

- **Hangar Door Effect**: ページ遷移時に左右から異なるカラー（左: Cyan, 右: Purple）の重厚なドアが閉まり、ローディング時間を隠蔽。
- **Seamless Navigation**: `Zustand` による状態管理でルーティングとドアのアニメーションを完全同期。宇宙船のハッチを開けて内部へ入るような一貫した体験を提供します。

### 3. パフォーマンス最適化 (Smart Boot Sequence)

- **Session Awareness**: 初回訪問時の「Boot Sequence（起動演出）」をセッションストレージで管理。2回目以降のアクセスや戻る操作時は演出をスキップし、即座にコンテンツを表示するストレスフリーな設計です。

### 3. ダイナミックなドキュメント (Dynamic Documentation)

- **Mermaid.js 統合**: プロジェクト詳細ページにおいて、システムアーキテクチャ図やシーケンス図をコードベース（Mermaid記法）から動的にレンダリング。
- ノードをクリックするとモーダルで拡大表示され、複雑な設計図も快適に閲覧可能です。

### 4. インタラクティブな Contact Form

- **Cloudflare Turnstile**: ボット対策として、プライバシー重視のTurnstile認証を導入。
- **Resend integration**: フォーム送信後、リッチなHTMLメールによる自動返信が送信されます。
- **Formspree**: 管理者への通知システムとして連携。

### 5. デュアルモード自己紹介 (Dual-Mode Timeline)

- **About Me**: 「PRO」モードと「GEEK」モードの2つの視点から、これまでの経歴やスキルセットを紹介します。
  - **PRO Mode**: 実務経験はまだありませんが、習得した技術スキルやこれまでの制作実績をビジネスライクな視点で真摯に解説。
  - **GEEK Mode**: 人生をソフトウェアのバージョンアップに見立て、ユーモアを交えてエンジニアとしての"生い立ち"を表現。

## 🛠 技術スタック (Tech Stack)

### Core

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **UI Library**: [React 19](https://react.dev/)

### Visuals & Animation

- **3D**: [Three.js](https://threejs.org/) / [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber)
- **Animation**: [GSAP](https://gsap.com/) (ScrollTrigger)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)

### Backend & Infrastructure

- **Email API**: [Resend](https://resend.com/)
- **Security**: [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/)
- **Deployment**: [Vercel](https://vercel.com/)

## 🔌 API Reference

本プロジェクトでは、お問い合わせ機能のためにAPIルート (`/api/contact`) を実装しています。

### `POST /api/contact`

コンタクトフォームからの入力を処理し、セキュリティ検証、通知、自動返信を一括して行います。

#### リクエストフロー

1. **Turnstile Verification**: クライアントから送信されたトークンをCloudflare APIで検証し、ボットでないことを確認。
2. **Formspree Forwarding**: 管理者（私）への通知として、データをFormspreeエンドポイントへ転送。
3. **Auto-Reply (Resend)**: 送信者に対し、Resend APIを使用してHTML形式の自動返信メールを送信（宇宙船のコンソール風デザイン）。

#### 必要な環境変数 (.env.local)

```bash
# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key

# Email (Resend)
RESEND_API_KEY=re_123456789

# Notification (Formspree)
FORMSPREE_ENDPOINT=https://formspree.io/f/your_form_id
```

## 💻 セットアップ (Getting Started)

プロジェクトをローカル環境で実行する手順です。

### 1. リポジトリのクローン

```bash
git clone https://github.com/EricKei2002/burst-style.git
cd burst-style
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local` ファイルを作成し、上記のAPIキー等を設定します。

### 4. 開発サーバーの起動

```bash
npm run dev
```

`http://localhost:3000` でサイトにアクセスできます。

## 📂 プロジェクト構造 (Project Structure)

```text
app/
├── api/                  # バックエンド API ルート
│   └── contact/          # お問い合わせフォーム用エンドポイント (Resend + Turnstile)
├── components/           # React コンポーネント
│   ├── demos/            # プロジェクト詳細ページ用のインタラクティブデモ
│   ├── sections/         # 主要なページセクション (Hero, About, Projects, Contact)
│   ├── ui/               # 再利用可能なUIパーツ (ボタン, カード, テキストエフェクト)
│   ├── visuals/          # 3D/Canvas コンポーネント (Three.js, Stars, HangarDoor)
│   └── SmoothScroll.tsx  # スムーススクロール用コンポーネント
├── lib/                  # 共有ロジック・データ (Data, Store)
├── projects/             # プロジェクト詳細ページ (動的ルーティング: /projects/[slug])
└── layout.tsx            # ルートレイアウト (フォント, メタデータ, CSS注入)
```

---

© 2026 Eric Kei / Burst Style
