import Image from "next/image";

const socials = [
  {
    href: "https://www.dribbble.com",
    label: "Dribbble",
  },
  {
    href: "https://www.behance.net",
    label: "Behance",
  },
  {
    href: "mailto:hello@burst.style",
    label: "Email",
  },
];

export default function Hero() {
  return (
    <section className="flex flex-col items-center gap-10 text-center sm:flex-row sm:items-start sm:gap-16 sm:text-left">
      <div className="relative h-28 w-28 overflow-hidden rounded-full border border-zinc-200 shadow-sm dark:border-zinc-800">
        <Image
          src="/projects/cuttingworks.jpg"
          alt="Burst Style studio avatar"
          fill
          className="object-cover"
          sizes="112px"
          priority
        />
      </div>
      <div className="flex flex-1 flex-col gap-6">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-400">
            Burst Style Studio
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-zinc-950 dark:text-zinc-50 md:text-4xl">
            ブランドに寄り添う、洗練されたデザインとクリエイティブを。
          </h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            ビジュアルアイデンティティからプロダクトUIまで、細部まで行き届いた表現で
            ビジネスを加速させます。東京を拠点にグローバル案件をサポートしています。
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
          {socials.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-900 transition-colors hover:border-zinc-900 hover:bg-zinc-900 hover:text-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-50 dark:hover:bg-zinc-50 dark:hover:text-zinc-950"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
