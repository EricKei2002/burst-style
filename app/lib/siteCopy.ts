export type Locale = "en" | "ja";

export function pick(locale: Locale, pair: Record<Locale, string>): string {
  return pair[locale];
}

export function buildSiteCopy(locale: Locale) {
  return {
    header: {
      langToggle: pick(locale, {
        en: "Language: English / 日本語",
        ja: "言語: English / 日本語",
      }),
      langEn: pick(locale, { en: "EN", ja: "EN" }),
      langJa: pick(locale, { en: "JA", ja: "JA" }),
    },
    hero: {
      establishing: "> ESTABLISHING CONNECTION...",
      question: pick(locale, {
        en: "> What is Burst Style ?",
        ja: "> Burst Style とは？",
      }),
      enterAria: pick(locale, {
        en: "Show details",
        ja: "詳細を表示する",
      }),
      tagline1: pick(locale, {
        en: '"Burst Style" — creativity that explodes into unfamiliar, memorable experiences.',
        ja: "「Burst Style」— 創造性を爆発させ、未知の体験を形にする。",
      }),
      tagline2: pick(locale, {
        en: "As a web engineer, I ship value that breaks the usual frame—with passion as the engine.",
        ja: "Webエンジニアとしての情熱を原動力に、既存の枠を打ち破る新しい価値を実装します。",
      }),
    },
    projects: {
      introLine1: pick(locale, {
        en: "Breaking defaults to build memorable experiences.",
        ja: "既成概念を打ち砕き、記憶に残る体験を。",
      }),
      introLine2: pick(locale, {
        en: "Burst Style—where design and engineering meet.",
        ja: "デザインと技術を融合した『Burst Style』の実践。",
      }),
      viewDetails: (title: string) =>
        locale === "ja" ? `「${title}」の詳細を見る` : `View details for ${title}`,
    },
    demos: {
      csharp: {
        tabDesign: pick(locale, { en: "Design", ja: "デザイン" }),
        tabSource: pick(locale, { en: "Source", ja: "ソース" }),
        designTabAria: pick(locale, {
          en: "Switch to calculator preview",
          ja: "電卓プレビュー表示に切り替え",
        }),
        sourceTabAria: pick(locale, {
          en: "Switch to C# source view",
          ja: "C#ソース表示に切り替え",
        }),
        clearAria: pick(locale, { en: "Clear calculation", ja: "計算をクリア" }),
        divideAria: pick(locale, { en: "Divide", ja: "割り算" }),
        multiplyAria: pick(locale, { en: "Multiply", ja: "掛け算" }),
        subtractAria: pick(locale, { en: "Subtract", ja: "引き算" }),
        addAria: pick(locale, { en: "Add", ja: "足し算" }),
        equalsAria: pick(locale, { en: "Show result", ja: "計算結果を表示" }),
        decimalAria: pick(locale, { en: "Decimal point", ja: "小数点" }),
      },
      todo: {
        tabPreview: pick(locale, { en: "Preview", ja: "プレビュー" }),
        tabCode: pick(locale, { en: "Code", ja: "コード" }),
        previewTabAria: pick(locale, {
          en: "Switch to preview",
          ja: "プレビュー表示に切り替え",
        }),
        codeTabAria: pick(locale, {
          en: "Switch to code view",
          ja: "コード表示に切り替え",
        }),
        heading: pick(locale, {
          en: "Todo list with TypeScript",
          ja: "Todoリスト with Typescript",
        }),
        newTaskLabel: pick(locale, { en: "New task", ja: "新しいタスク" }),
        placeholder: pick(locale, { en: "New task", ja: "新しいタスク" }),
        submit: pick(locale, { en: "Add", ja: "作成" }),
        delete: pick(locale, { en: "Del", ja: "消" }),
        todoContentAria: (n: number) =>
          pick(locale, {
            en: `Text for todo item ${n}`,
            ja: `Todo ${n} の内容`,
          }),
        todoCompleteAria: (n: number) =>
          pick(locale, {
            en: `Mark todo item ${n} complete`,
            ja: `Todo ${n} を完了済みにする`,
          }),
        todoDeleteAria: (n: number) =>
          pick(locale, {
            en: `Delete todo item ${n}`,
            ja: `Todo ${n} を削除`,
          }),
      },
    },
    about: {
      intro: pick(locale, {
        en: "Background and milestones in a timeline—how I grew into the work I do now.",
        ja: "技術と経験を積み上げてきた背景を、タイムライン形式で紹介します。",
      }),
      contactCta: pick(locale, { en: "Contact", ja: "お問い合わせ" }),
      geekModeLabel: pick(locale, {
        en: "Geek Mode",
        ja: "ギークモード",
      }),
      proModeLabel: pick(locale, {
        en: "Pro Mode",
        ja: "プロモード",
      }),
      switchGeekAria: pick(locale, {
        en: "Switch to Geek Mode",
        ja: "ギークモードに切り替え",
      }),
      switchProAria: pick(locale, {
        en: "Switch to Pro Mode",
        ja: "プロモードに切り替え",
      }),
      videoPlay: (title: string) =>
        pick(locale, {
          en: `Play video: ${title}`,
          ja: `「${title}」の動画を再生`,
        }),
    },
    contact: {
      leadLine1: pick(locale, {
        en: "New projects, collaboration, or a casual hello—",
        ja: "新しいプロジェクト、コラボレーション、またはカジュアルな挨拶まで。",
      }),
      leadLine2: pick(locale, {
        en: "the line to Burst Style stays open.",
        ja: "『Burst Style』への通信回線は常に開かれています。",
      }),
      formName: pick(locale, { en: "NAME", ja: "お名前" }),
      formEmail: pick(locale, { en: "EMAIL", ja: "メール" }),
      formMessage: pick(locale, { en: "MESSAGE", ja: "本文" }),
      placeholderName: pick(locale, {
        en: "Your name",
        ja: "山田 太郎",
      }),
      placeholderEmail: pick(locale, {
        en: "you@example.com",
        ja: "email@example.com",
      }),
      placeholderMessage: pick(locale, {
        en: "What would you like to say?",
        ja: "お問い合わせ内容をご入力ください...",
      }),
      securityLoading: pick(locale, {
        en: "SECURITY CHECK LOADING...",
        ja: "セキュリティ確認を読み込み中...",
      }),
      turnstileDisabled: pick(locale, {
        en: "Turnstile disabled: set NEXT_PUBLIC_TURNSTILE_SITE_KEY (local: .env.local, production: Vercel env).",
        ja: "Turnstile 未設定: NEXT_PUBLIC_TURNSTILE_SITE_KEY を設定してください（ローカルは .env.local、本番は Vercel の環境変数）。",
      }),
      turnstileKeySwapped: pick(locale, {
        en: "NEXT_PUBLIC_TURNSTILE_SITE_KEY has the secret key. In Vercel, use the Site Key (short) for this variable and the Secret Key for TURNSTILE_SECRET_KEY, then redeploy.",
        ja: "NEXT_PUBLIC_TURNSTILE_SITE_KEY にシークレットキーが入っています。Vercel ではサイトキー（短い方）とシークレットキー（長い方）を入れ替えて再デプロイしてください。",
      }),
      turnstileLoadError: pick(locale, {
        en: "Security check failed to load. Check Cloudflare hostnames (burst.style) and that the Site Key is in NEXT_PUBLIC_TURNSTILE_SITE_KEY.",
        ja: "セキュリティ確認の読み込みに失敗しました。Cloudflare のホスト名と、Vercel のサイトキー設定を確認してください。",
      }),
      errTurnstile: pick(locale, {
        en: "Security check not ready. Wait for Turnstile to finish loading, then try again.",
        ja: "セキュリティ確認の準備ができていません。読み込み完了後に再試行してください。",
      }),
      errTransmit: pick(locale, {
        en: "Transmission failed. Please try again.",
        ja: "送信に失敗しました。もう一度お試しください。",
      }),
      errConnection: pick(locale, {
        en: "Connection error. Please try again.",
        ja: "接続エラーです。もう一度お試しください。",
      }),
      sending: pick(locale, { en: "SENDING...", ja: "送信中..." }),
      send: pick(locale, { en: "SEND MESSAGE", ja: "送信する" }),
      successTitle: pick(locale, { en: "Message received", ja: "送信完了" }),
      successBody1: pick(locale, { en: "Thanks for reaching out.", ja: "お問い合わせありがとうございます。" }),
      successBody2: pick(locale, {
        en: "Your message was delivered successfully.",
        ja: "送信されたデータは正常に受信されました。",
      }),
      successBody3: pick(locale, {
        en: "I’ll get back to you as soon as I can.",
        ja: "確認次第、折り返しご連絡いたします。",
      }),
      sendAnother: pick(locale, {
        en: "< Send another message",
        ja: "< 別のメッセージを送る",
      }),
    },
  };
}

export type SiteCopy = ReturnType<typeof buildSiteCopy>;
