"use client";

export default function Header() {
  return (
    <header className="sticky inset-x-0 top-0 z-30 mt-4 sm:mt-5">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-stretch gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-stretch lg:justify-between lg:gap-6 lg:px-8">
        <div
          aria-hidden="true"
          className="inline-flex min-h-[68px] w-full items-center rounded-xl border border-green-400/30 bg-zinc-900/60 px-4 py-2.5 font-mono text-sm sm:text-base tracking-wide text-green-200 lg:max-w-[340px]"
        >
          <span className="text-green-200">My Web SIte</span>
        </div>
        <nav
          aria-label="サイト内ナビゲーション"
          className="min-h-[68px] w-full rounded-xl border border-green-400/30 bg-zinc-900/60 px-4 py-2.5 font-mono text-xs sm:text-sm tracking-wide text-left text-green-200 lg:max-w-[760px]"
        >
          <div className="flex flex-wrap items-center gap-x-0.5 gap-y-0.5">
            <span className="text-green-200">Eric Kei</span>
            <span className="text-green-300">@</span>
            <span className="text-green-200">Burst Style</span>
            <span className="text-green-300">~</span>
            <span className="text-green-200">&gt;</span>
            <span className="text-green-200">ls</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-8">
            <a href="#projects" aria-label="Projectsセクションへ移動" className="transition-colors hover:text-fuchsia-300 focus-visible:text-green-100">
              /Projects
            </a>
            <a href="#about" aria-label="Aboutセクションへ移動" className="transition-colors hover:text-fuchsia-300 focus-visible:text-green-100">
              /About Me
            </a>
            <a href="#contact" aria-label="Contactセクションへ移動" className="transition-colors hover:text-fuchsia-300 focus-visible:text-green-100">
              /Contact
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
