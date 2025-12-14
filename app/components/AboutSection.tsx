const experience = [
  {
    title: "クリエイティブディレクター / Burst Style",
    period: "2020 - Present",
    description:
      "ブランド戦略からビジュアル制作まで一貫してリード。グローバルブランドのローンチを複数担当。",
  },
  {
    title: "UI/UX デザイナー / Freelance",
    period: "2016 - 2020",
    description:
      "BtoB SaaS のプロダクトデザインとデザインシステム構築を支援。アクセシビリティ改善に注力。",
  },
];

export default function AboutSection() {
  return (
    <section className="flex flex-col gap-10 rounded-3xl border border-zinc-200/70 bg-white/80 p-8 shadow-lg backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-900/70 sm:p-10">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-400">
          About
        </p>
        <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
          自己紹介
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Burst Style
          のクリエイティブディレクター。デザインと言葉を行き来しながら、
          ブランドの可能性を最大化する体験づくりを追求しています。
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/40">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            ミッション
          </h2>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            「伝えたい価値が正しく届く」ブランドコミュニケーションを実現すること。
            リサーチに基づいた戦略設計と、ディテールまでこだわった表現で、共感を得るデザインを提供します。
          </p>
        </div>
        <div className="space-y-4 rounded-2xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/40">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            スキルセット
          </h2>
          <ul className="space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            <li>ブランドアイデンティティ構築 / VI・CI デザイン</li>
            <li>デジタルプロダクトのUI設計とプロトタイピング</li>
            <li>デザインシステムの設計・運用</li>
            <li>コピーライティングとアートディレクション</li>
          </ul>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          経歴
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {experience.map((role) => (
            <article
              key={role.title}
              className="rounded-2xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950/40"
            >
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  {role.title}
                </h3>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {role.period}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {role.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
