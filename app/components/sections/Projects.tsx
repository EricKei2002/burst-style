"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TiltCard from "../ui/TiltCard";

import { projectsData } from "../../lib/data";
import { useLocale, useSiteCopy } from "../../lib/locale";
import { getLocalizedProject } from "../../lib/projectEn";
import { preloadShaderTransition } from "../../lib/shaderTransitionLoader";
import { preloadSpaceshipAisleVideo } from "../../lib/spaceshipVideoPreload";
import { sectionPageLabel } from "../../lib/homeSections";
import { beginLeaveTransition, useTransitionStore } from "../../lib/store";

export default function Projects() {
  const { locale } = useLocale();
  const copy = useSiteCopy();
  const router = useRouter();
  const { setPhase } = useTransitionStore();

  const handleNavigation = (url: string) => {
    preloadSpaceshipAisleVideo();
    preloadShaderTransition();
    // シェーダーが使えればワープ、なければハンガー扉（待機時間も合わせる）
    const navigateDelayMs = beginLeaveTransition();

    setTimeout(() => {
      setPhase("closed");
      router.push(url);
    }, navigateDelayMs);
  };

  return (
    <section id="projects" className="relative w-full py-24 sm:py-32">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-16 max-w-2xl rounded-2xl border border-white/10 bg-black/85 p-6 backdrop-blur-sm">
          <p className="mb-4 font-mono text-sm text-fuchsia-200">
            <span aria-hidden="true">[{sectionPageLabel("projects")}] </span>
            ~/projects
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
            Projects
          </h2>
          <p className="text-zinc-50 leading-relaxed">
            {copy.projects.introLine1}
            <br className="hidden sm:block" />
            {copy.projects.introLine2}
          </p>
        </div>

        {/* プロジェクトグリッド */}
        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          {projectsData.map((raw, index) => {
            const project = getLocalizedProject(raw, locale);
            // カード数が奇数の場合、最後の1枚だけが片側に孤立して大きな空白ができるため
            // 最後のカードを2カラム分に広げて余白を埋める
            const isDanglingLast =
              index === projectsData.length - 1 &&
              projectsData.length % 2 === 1;
            return (
              <TiltCard
                key={project.slug}
                className={`h-full ${isDanglingLast ? "md:col-span-2" : ""}`}
              >
                <Link
                  href={`/projects/${project.slug}`}
                  prefetch={false}
                  onPointerEnter={() => {
                    preloadSpaceshipAisleVideo();
                    preloadShaderTransition();
                    router.prefetch(`/projects/${project.slug}`);
                  }}
                  onFocus={() => {
                    preloadShaderTransition();
                    router.prefetch(`/projects/${project.slug}`);
                  }}
                  onClick={(e) => {
                    // 新しいタブで開くなどの修飾クリックはブラウザに任せる
                    if (
                      e.button !== 0 ||
                      e.metaKey ||
                      e.ctrlKey ||
                      e.shiftKey ||
                      e.altKey
                    )
                      return;
                    e.preventDefault();
                    handleNavigation(`/projects/${project.slug}`);
                  }}
                  className="project-card group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/85 text-left transition-colors duration-300 ease-out hover:border-fuchsia-400/60 hover:bg-zinc-900/90"
                >
                  {/* 画像コンテナ */}
                  <div className="relative aspect-video w-full overflow-hidden bg-zinc-800">
                    <div className="absolute inset-0 z-10 bg-zinc-950/20 transition-colors group-hover:bg-transparent" />
                    <Image
                      src={project.image}
                      // 見出し（h3）と同じ文言を二重に読ませない
                      alt=""
                      fill
                      className="object-cover"
                      sizes={
                        isDanglingLast
                          ? "(min-width: 1280px) 1216px, 100vw"
                          : "(min-width: 1280px) 584px, (min-width: 768px) 50vw, 100vw"
                      }
                    />
                  </div>

                  {/* コンテンツ */}
                  <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white group-hover:text-fuchsia-300 transition-colors">
                          {project.title}
                        </h3>
                        <span
                          aria-hidden="true"
                          className="shrink-0 font-mono text-xs text-zinc-300 transition-colors group-hover:text-fuchsia-300"
                        >
                          cd ./{project.slug}
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-relaxed text-zinc-200">
                        {project.description}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs font-mono text-fuchsia-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
