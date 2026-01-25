import { projectsData } from "../../lib/data";
import Image from "next/image";
import { notFound } from "next/navigation";
import DecryptedText from "../../components/ui/DecryptedText";
import ProjectDocs from "../../components/ui/ProjectDocs";
import BackButton from "../../components/ui/BackButton";

// 静的エクスポートのために静的パラメータが生成されることを確認
export function generateStaticParams() {
  return projectsData.map((project) => ({
    slug: project.slug,
  }));
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projectsData.find((p) => p.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <article className="min-h-screen pt-24 pb-16 px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        
        {/* ナビゲーション - 固定配置のためここでは削除、または空のdivを残すことなく配置 */}
        <BackButton />
        {/* ヘッダーセクション */}
        <header className="mb-12">
            <div className="flex flex-col gap-6">
                 <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
                    <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        className={project.slug === 'burst-style' ? "object-contain bg-black p-4" : "object-cover"}
                        priority
                    />
                 </div>
                 
                 <div className="space-y-4">
                     <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                        <DecryptedText text={project.title} animateOnHover speed={40} />
                     </h1>
                     <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                            <span key={tag} className="px-3 py-1 rounded-full border border-zinc-700 bg-zinc-800/50 text-xs font-mono text-fuchsia-400">
                                #{tag}
                            </span>
                        ))}
                     </div>
                 </div>
            </div>
        </header>

        {/* コンテンツグリッド */}
        <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
            
            <div className="space-y-12">
                {/* 説明 */}
                <section>
                    <h2 className="text-xl font-bold text-zinc-100 mb-4 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]"></span>
                        Overview
                    </h2>
                    <p className="text-zinc-300 leading-relaxed dark:text-zinc-300">
                        {project.detailedDescription}
                    </p>
                </section>

                <ProjectDocs documentation={project.documentation} />

                {/* 課題 */}
                <section>
                    <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                        Challenges & Solutions
                    </h2>
                    <div className="grid gap-6">
                        {project.challenges.map((item, idx) => (
                            <div key={idx} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
                                <h3 className="text-fuchsia-400 font-medium mb-2 text-sm font-mono tracking-wider">
                                    [PROBLEM_{idx + 1}] {item.title}
                                </h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                 {/* 改善点 */}
                 <section>
                    <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                         <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                        Future Improvements
                    </h2>
                    <ul className="space-y-4">
                        {project.improvements.map((item, idx) => (
                             <li key={idx} className="flex gap-4 bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-white/5">
                                <div className="flex flex-col items-center">
                                    <div className="h-2 w-2 rounded-full bg-zinc-700 mt-2"></div>
                                    <div className="w-px h-full bg-zinc-800 my-1"></div>
                                </div>
                                <div className="pb-0">
                                    <h4 className="text-zinc-200 font-medium mb-1">{item.title}</h4>
                                    <p className="text-zinc-300 text-sm leading-relaxed">{item.description}</p>
                                </div>
                             </li>
                        ))}
                    </ul>
                </section>

            </div>

            {/* サイドバー (テックスタック & リンク) */}
            <div className="space-y-8">
                {/* リンク */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-4">
                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Links</h3>
                    <div className="flex flex-col gap-3">
                        {project.siteUrl && (
                             <a 
                                href={project.siteUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-between w-full px-4 py-3 rounded-lg bg-fuchsia-600/10 text-fuchsia-400 border border-fuchsia-500/20 hover:bg-fuchsia-600/20 transition-all font-mono text-xs"
                             >
                                <span>Visit Site</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                             </a>
                        )}
                        {project.githubUrl && (
                            <a 
                                href={project.githubUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-between w-full px-4 py-3 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-all font-mono text-xs"
                            >
                                <span>GitHub Repo</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                            </a>
                        )}
                    </div>
                </div>

                {/* テックスタック */}
                 <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-4">
                    <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Tech Stack</h3>
                    <ul className="space-y-2">
                        {project.techStack.map((tech, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-zinc-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-zinc-600"></span>
                                {tech.name}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>

      </div>
    </article>
  );
}
