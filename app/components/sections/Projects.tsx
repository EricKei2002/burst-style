"use client";

import { useEffect, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
    void beginLeaveTransition().then((navigateDelayMs) => {
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
            <p className="instrument-label enter-rise mb-4 flex items-center justify-between gap-3">
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
            <h2 className="enter-rise mb-4 font-sans text-4xl font-black tracking-[-0.04em] text-white [--i:1] sm:text-5xl">
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
            {/* 駐機の段階。どれが点くかは CSS が決める（3D の準備完了は <html data-planet-scene>、
                看板に乗っている間は駐機窓の data-inspect）。読み上げには出さない */}
            <ol
              aria-hidden="true"
              className="hangar-stage instrument-tag absolute top-2 left-3"
            >
              <li className="hangar-stage__pad">PAD-01</li>
              <li data-stage="approach">{ja ? "接近" : "approach"}</li>
              <li data-stage="docked">{ja ? "駐機" : "docked"}</li>
              <li data-stage="inspect">{ja ? "点検" : "inspect"}</li>
            </ol>
            {/* 看板ごとの点検の札（キーボードと読み上げの入口）。押すと看板のクリックと同じく
                HANGAR_EXHIBIT_EVENT を流し、上の handleNavigation（ワープ）で開く。
                フォーカス中は駐機窓に data-inspect を付け、段階ラベルを「点検」にする */}
            <ul
              aria-label={ja ? "格納庫の看板" : "Hangar signs"}
              className="hangar-signs"
              onFocus={(e) => {
                const bay =
                  e.currentTarget.closest<HTMLElement>("[data-hangar-bay]");
                if (bay) bay.dataset.inspect = "";
              }}
              onBlur={(e) => {
                const bay =
                  e.currentTarget.closest<HTMLElement>("[data-hangar-bay]");
                const next = e.relatedTarget as Node | null;
                if (bay && !(next && bay.contains(next))) {
                  delete bay.dataset.inspect;
                }
              }}
            >
              {projectsData.map((raw, index) => {
                const project = getLocalizedProject(raw, locale);
                return (
                  <li key={project.slug}>
                    <button
                      type="button"
                      data-hangar-sign={project.slug}
                      aria-label={
                        ja
                          ? `${project.title}の看板を点検して開く`
                          : `Inspect and open ${project.title}`
                      }
                      onPointerEnter={() => {
                        preloadShaderTransition();
                        router.prefetch(`/projects/${project.slug}`);
                      }}
                      onFocus={() => {
                        preloadShaderTransition();
                        router.prefetch(`/projects/${project.slug}`);
                      }}
                      onClick={(e) => {
                        // 3D の看板のクリック判定（document の click）には渡さない
                        e.preventDefault();
                        window.dispatchEvent(
                          new CustomEvent<HangarExhibitDetail>(
                            HANGAR_EXHIBIT_EVENT,
                            { detail: { slug: project.slug } },
                          ),
                        );
                      }}
                      className="hangar-sign"
                    >
                      <span aria-hidden="true" className="hangar-sign__no">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span aria-hidden="true" className="hangar-sign__name">
                        {project.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
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
              <div
                key={project.slug}
                className={`enter-rise h-full ${isDanglingLast ? "md:col-span-2" : ""}`}
                style={{ "--i": Math.min(index, 4) } as CSSProperties}
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
                  className="project-card group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-[6px] border border-white/12 bg-[rgb(7_7_11/0.96)] text-left transition-[border-color,scale] duration-200 ease-out hover:border-[rgb(var(--planet-accent)/0.7)] motion-safe:active:scale-[0.99]"
                >
                  {/* 画像コンテナ */}
                  <div className="relative aspect-video w-full overflow-hidden bg-zinc-800">
                    <div className="absolute inset-0 z-10 bg-zinc-950/25 transition-opacity duration-200 ease-out group-hover:opacity-0" />
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
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="font-sans text-xl font-bold tracking-tight text-white sm:text-2xl">
                          <span className="project-card__title">
                            {project.title}
                          </span>
                        </h3>
                        <span
                          aria-hidden="true"
                          className="shrink-0 font-mono text-xs text-zinc-300 transition-colors duration-150 group-hover:text-[rgb(var(--planet-accent))]"
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
              </div>
            );
          })}
        </div>

        {/* 文字だけの作品一覧：3D もカード画像もなしで、全作品の説明を読める。
            番号・題名・タグ・説明を罫線で区切った索引として組む（行に乗ると左の目盛りと下線が走る） */}
        <section
          id="projects-index"
          aria-labelledby="projects-index-title"
          className="instrument-panel mt-16 px-5 pt-5 pb-2 sm:mt-24 sm:px-8 sm:pt-7"
        >
          <div className="grid gap-x-8 gap-y-2 border-b border-white/10 pb-5 md:grid-cols-[4.5rem_minmax(0,1fr)_auto] md:items-end">
            <p className="instrument-label md:pb-1">ls -l</p>
            <div>
              <h3
                id="projects-index-title"
                className="font-sans text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl"
              >
                {ja ? "作品一覧（テキスト）" : "Project index (text)"}
              </h3>
              <p className="mt-2 max-w-[40em] text-sm leading-relaxed text-zinc-300">
                {ja
                  ? "画像や 3D を使わずに、すべての作品の概要を読めます。"
                  : "Every project summary, without images or 3D."}
              </p>
            </div>
            <p
              aria-hidden="true"
              className="font-mono text-xs tabular-nums text-zinc-400 md:pb-1"
            >
              {String(projectsData.length).padStart(2, "0")}{" "}
              {ja ? "件" : "entries"}
            </p>
          </div>
          <ol className="projects-index">
            {projectsData.map((raw, index) => {
              const project = getLocalizedProject(raw, locale);
              return (
                <li
                  key={project.slug}
                  className="projects-index__row group relative grid gap-x-8 gap-y-3 border-b border-white/10 py-7 last:border-b-0 md:grid-cols-[4.5rem_minmax(0,18rem)_minmax(0,1fr)] md:py-9"
                >
                  <span
                    aria-hidden="true"
                    className="projects-index__no font-mono text-sm tabular-nums text-zinc-400"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h4 className="font-sans text-2xl leading-tight font-bold tracking-[-0.03em] text-white sm:text-[1.75rem]">
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
                        className="projects-index__link"
                      >
                        {project.title}
                      </Link>
                    </h4>
                    <ul
                      aria-label={ja ? "タグ" : "Tags"}
                      className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs leading-relaxed text-zinc-300"
                    >
                      {project.tags.map((tag) => (
                        <li key={tag} className="projects-index__tag">
                          #{tag}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="max-w-[42em] space-y-3 text-[15px] leading-relaxed text-zinc-200">
                    <p className="text-zinc-50">{project.description}</p>
                    <p>{project.detailedDescription}</p>
                    <p
                      aria-hidden="true"
                      className="projects-index__open font-mono text-xs text-[rgb(var(--planet-accent))]"
                    >
                      cd ./{project.slug} →
                    </p>
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
