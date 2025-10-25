import Image from "next/image";

const projects = [
  {
    title: "Cutting Works",
    description: "お店看板、クルマやバイクのドレスアップなど、多彩なカッティングステッカー・デザインサイト制作",
    image: "/projects/bg cwb.jpeg",
    url: "https://cuttingworks.burst.style",
  },
  {
    title: "AiDay",
    description:
      "AIが予定を分析し、最適なスケジュールを提案する次世代カレンダーアプリ",
    image: "/projects/aiday.jpg",
    url: "#aiday",
  },
];

export default function Projects() {
  return (
    <section className="flex w-full flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="text-sm uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-400">
          Featured Projects
        </p>
        <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          創造力で価値を生み出すプロジェクト
        </h2>
        <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
          デザインとテクノロジーを融合し、課題を解決しながらブランドの魅力を引き出した事例をご紹介します。
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <article
            key={project.title}
            className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800"
          >
            <div className="relative h-56 w-full bg-zinc-100 dark:bg-zinc-900">
              <Image
                src={project.image}
                alt={project.title}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(min-width: 768px) 50vw, 100vw"
                priority
              />
            </div>
            <div className="flex flex-1 flex-col gap-4 p-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  {project.title}
                </h3>
                <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {project.description}
                </p>
              </div>
              <a
                href={project.url}
                className="text-sm font-medium text-zinc-900 underline-offset-4 transition hover:underline dark:text-zinc-100"
              >
                View project
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
