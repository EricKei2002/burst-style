"use client";

import { useState, useEffect } from "react";
import { FiCpu } from "react-icons/fi";

interface ProjectDocsProps {
  documentation: {
    architectureHtmlUrl: string;
  };
}

export default function ProjectDocs({ documentation }: ProjectDocsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const htmlUrl = documentation.architectureHtmlUrl;

  useEffect(() => {
    if (!isExpanded) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isExpanded]);

  return (
    <>
      <button
        type="button"
        aria-label="システム構成図を拡大表示"
        aria-haspopup="dialog"
        aria-expanded={isExpanded}
        className="group w-full overflow-hidden rounded-2xl border border-zinc-800 bg-[#0d1117] text-left transition-all hover:border-zinc-600 focus-visible:outline-none"
        onClick={() => setIsExpanded(true)}
      >
        <div className="border-b border-zinc-800 bg-[#010409] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiCpu className="text-zinc-400" size={18} />
            <span className="text-sm font-medium text-zinc-200">
              システム構成図
            </span>
          </div>
          <span className="text-xs text-zinc-400 group-hover:text-fuchsia-400 translation-colors">
            クリックして拡大
          </span>
        </div>

        <div className="flex flex-col items-center justify-center bg-[#0d1117] p-4">
          <iframe
            src={htmlUrl}
            title="システム構成図プレビュー"
            className="h-[620px] w-full rounded-lg border border-zinc-800 pointer-events-none"
            tabIndex={-1}
            aria-hidden="true"
          />
          <p className="mt-4 text-xs text-zinc-400 font-mono">
            システム設計とデータフロー（クリックして拡大・操作可能な図を開く）
          </p>
        </div>
      </button>

      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setIsExpanded(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="システム構成図"
            className="relative flex h-[95vh] w-full max-w-[98vw] flex-col overflow-hidden rounded-xl border border-zinc-700 bg-[#0d1117] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
              <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <FiCpu /> システム構成図
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 rounded-full transition-colors"
                aria-label="ダイアグラムを閉じる"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <iframe
              src={htmlUrl}
              title="システム構成図"
              className="min-h-0 w-full flex-1 border-0"
            />
          </div>
        </div>
      )}
    </>
  );
}
