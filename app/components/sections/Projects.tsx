"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import TiltCard from "../ui/TiltCard";

import { projectsData } from "../../lib/data";
import { useLocale, useSiteCopy } from "../../lib/locale";
import { getLocalizedProject } from "../../lib/projectEn";
import { preloadShaderTransition } from "../../lib/shaderTransitionLoader";
import { sectionPageLabel } from "../../lib/homeSections";
import { beginLeaveTransition, useTransitionStore } from "../../lib/store";
import {
  HANGAR_EXHIBIT_EVENT,
  type HangarExhibitDetail,
} from "../../lib/hangarExhibit";

export default function Projects() {
  const { locale } = useLocale();
  const copy = useSiteCopy();
  const router = useRouter();
  const { setPhase } = useTransitionStore();

  const handleNavigation = (url: string) => {
    preloadShaderTransition();
    // 詳細も Projects の惑星の中。突入ではなく、同じ大気の中を進む。
    void beginLeaveTransition({
      journey: "fly-between",
      planetId: "projects",
      fromPlanetId: "projects",
    }).then((navigateDelayMs) => {
      setTimeout(() => {
        setPhase("closed");
        router.push(url);
      }, navigateDelayMs);
    });
  };

  // 格納庫の看板（3D の展示物）が選ばれたら、カードと同じ遷移で詳細を開く
  useEffect(() => {
    const onExhibit = (event: Event) => {
      const { slug } = (event as CustomEvent<HangarExhibitDetail>).detail;
      if (!projectsData.some((p) => p.slug === slug)) return;
      handleNavigation(`/projects/${slug}`);
    };
    window.addEventListener(HANGAR_EXHIBIT_EVENT, onExhibit);
    return () => window.removeEventListener(HANGAR_EXHIBIT_EVENT, onExhibit);
  });

  const ja = locale === "ja";

  return (
    <section
      id="projects"
      className="relative w-full pt-6 pb-24 sm:pt-10 sm:pb-32"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 見出しの計器と、駐機機体を見せる窓（PC は横並び、スマホは縦） */}
        <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
          <div className="instrument-panel self-start p-5 sm:p-6 lg:col-span-5">
            <p className="instrument-label mb-4 flex items-center justify-between gap-3">
              <span>
                <span aria-hidden="true">
                  [{sectionPageLabel("projects")}]{" "}
                </span>
                ~/projects
              </span>
              <span aria-hidden="true" className="tabular-nums text-zinc-400">
                {String(projectsData.length).padStart(2, "0")}{" "}
                {ja ? "件" : "items"}
              </span>
            </p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Projects
            </h2>
            <p className="text-[15px] leading-relaxed text-zinc-100">
              {copy.projects.introLine1}
              <br className="hidden sm:block" />
              {copy.projects.introLine2}
            </p>
            <p className="mt-5 border-t border-white/10 pt-4 text-[13px] leading-relaxed text-zinc-300">
              {ja
                ? "下のカード、格納庫の看板、文字だけの一覧のどれからでも開けます。"
                : "Open any project from the cards, the hangar signs, or the text-only index."}{" "}
              <a
                href="#projects-index"
                className="font-semibold text-fuchsia-200 underline decoration-fuchsia-300/60 underline-offset-4 hover:text-white"
              >
                {ja ? "作品一覧（テキスト）へ" : "Text index"}
              </a>
            </p>
          </div>
          {/* 駐機窓：この枠の中に 3D の駐機機体と看板が収まる（PlanetInterior がカメラを合わせる） */}
          <div
            data-hangar-bay
            className="hangar-bay relative h-[36vh] min-h-[220px] lg:col-span-7 lg:h-[min(52vh,460px)]"
          >
            <span
              aria-hidden="true"
              className="hangar-bay__corner hangar-bay__corner--tl"
            />
            <span
              aria-hidden="true"
              className="hangar-bay__corner hangar-bay__corner--tr"
            />
            <span
              aria-hidden="true"
              className="hangar-bay__corner hangar-bay__corner--bl"
            />
            <span
              aria-hidden="true"
              className="hangar-bay__corner hangar-bay__corner--br"
            />
            <p className="instrument-tag absolute top-2 left-3">
              PAD-01 · {ja ? "駐機中" : "docked"}
            </p>
            <p className="instrument-tag absolute right-3 bottom-2 max-sm:hidden">
              {ja ? "看板を選ぶと作品が開く" : "select a sign to open"}
            </p>
          </div>
        </div>

        <div className="mt-10 mb-6 flex items-baseline justify-between gap-4 sm:mt-14">
          <h3 className="instrument-tag inline-block text-[13px]">
            ls ./projects --cards
          </h3>
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
                  className="project-card group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-left transition-colors duration-300 ease-out hover:border-fuchsia-400/60 hover:bg-zinc-900/90"
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

        {/* 文字だけの作品一覧：3D もカード画像もなしで、全作品の説明を読める */}
        <section
          id="projects-index"
          aria-labelledby="projects-index-title"
          className="instrument-panel mt-16 scroll-mt-28 p-5 sm:mt-24 sm:p-8"
        >
          <p className="instrument-label mb-3">ls -l ./projects --text</p>
          <h3
            id="projects-index-title"
            className="mb-2 text-2xl font-bold tracking-tight text-white"
          >
            {ja ? "作品一覧（テキスト）" : "Project index (text)"}
          </h3>
          <p className="mb-8 text-sm leading-relaxed text-zinc-300">
            {ja
              ? "画像や 3D を使わずに、すべての作品の概要を読めます。"
              : "Every project summary, without images or 3D."}
          </p>
          <ol className="divide-y divide-white/10 border-y border-white/10">
            {projectsData.map((raw, index) => {
              const project = getLocalizedProject(raw, locale);
              return (
                <li
                  key={project.slug}
                  className="grid gap-x-8 gap-y-3 py-6 md:grid-cols-[4.5rem_minmax(0,16rem)_minmax(0,1fr)]"
                >
                  <span
                    aria-hidden="true"
                    className="font-mono text-sm tabular-nums text-zinc-400"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h4 className="text-lg font-semibold text-white">
                      <Link
                        href={`/projects/${project.slug}`}
                        prefetch={false}
                        onClick={(e) => {
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
                        className="underline decoration-fuchsia-300/50 underline-offset-4 hover:text-fuchsia-200 hover:decoration-fuchsia-200"
                      >
                        {project.title}
                      </Link>
                    </h4>
                    <p className="mt-2 font-mono text-xs leading-relaxed text-fuchsia-200">
                      {project.tags.map((tag) => `#${tag}`).join("  ")}
                    </p>
                  </div>
                  <div className="space-y-3 text-[15px] leading-relaxed text-zinc-200">
                    <p className="text-zinc-50">{project.description}</p>
                    <p>{project.detailedDescription}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </section>
  );
}
