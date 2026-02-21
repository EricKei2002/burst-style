"use client";

import { useState, useEffect, useRef } from "react";
import mermaid from "mermaid";
import { FiCpu } from "react-icons/fi";

interface ProjectDocsProps {
  documentation: {
    architectureMermaid: string;
  };
}

export default function ProjectDocs({ documentation }: ProjectDocsProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isExpanded) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isExpanded]);

  useEffect(() => {
    // Mermaidをレンダリングする関数
    const render = async (ref: React.RefObject<HTMLDivElement | null>, idSuffix: string) => {
        if (ref.current) {
            try {
                ref.current.innerHTML = '';
                const id = `mermaid-${idSuffix}-${Date.now()}`;
                const { svg } = await mermaid.render(id, documentation.architectureMermaid);
                ref.current.innerHTML = svg;
            } catch (error) {
                console.error("Mermaid render error:", error);
                ref.current.innerHTML = "Diagram render failed.";
            }
        }
    };

    mermaid.initialize({
        startOnLoad: true,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'monospace',
        themeVariables: {
            primaryColor: '#1e1e1e',
            primaryTextColor: '#e4e4e7',
            primaryBorderColor: '#3f3f46',
            lineColor: '#a1a1aa',
            secondaryColor: '#27272a',
            tertiaryColor: '#18181b',
        }
    });

    render(mermaidRef, 'thumb');
    if (isExpanded) {
        // モーダルがレンダリングされるのを少し遅延させる
        setTimeout(() => render(modalRef, 'modal'), 100);
    }
  }, [documentation.architectureMermaid, isExpanded]);

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
                <span className="text-sm font-medium text-zinc-200">システム構成図</span>
             </div>
             <span className="text-xs text-zinc-400 group-hover:text-fuchsia-400 translation-colors">クリックして拡大</span>
          </div>

          <div className="p-8 flex flex-col items-center justify-center bg-[#0d1117] min-h-[300px]">
              <div ref={mermaidRef} className="w-full flex justify-center overflow-x-auto my-4 pointer-events-none"></div>
              <p className="mt-8 text-xs text-zinc-400 font-mono">
                システム設計とデータフロー
              </p>
          </div>
        </button>

        {/* 拡大表示用のモーダル */}
        {isExpanded && (
            <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8"
                onClick={() => setIsExpanded(false)}
            >
                <div 
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="project-docs-title"
                    className="relative w-full max-w-[90vw] max-h-[90vh] overflow-auto rounded-xl border border-zinc-700 bg-[#0d1117] p-8 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        onClick={() => setIsExpanded(false)}
                        className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-800/50 rounded-full transition-colors"
                        aria-label="ダイアグラムを閉じる"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    
                    <h3 id="project-docs-title" className="text-xl font-bold text-zinc-100 mb-8 flex items-center gap-2">
                        <FiCpu /> システム構成図
                    </h3>
                    
                    <div className="flex justify-center w-full overflow-auto">
                        <div ref={modalRef} className="min-w-full flex justify-center p-4"></div>
                    </div>
                </div>
            </div>
        )}
    </>
  );
}
