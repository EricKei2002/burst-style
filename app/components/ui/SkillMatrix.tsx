"use client";

import { useLocale, useSiteCopy } from "../../lib/locale";
import { skillGroups, type SkillGroup } from "../../lib/skills";

// 習熟度（3段階）をドット数で示す
const LEVEL_DOTS: Record<SkillGroup["id"], number> = {
  core: 3,
  built: 2,
  learning: 1,
};

export default function SkillMatrix({
  isProfessional,
}: {
  isProfessional: boolean;
}) {
  const { locale } = useLocale();
  const copy = useSiteCopy();
  const accent = isProfessional ? "bg-blue-500" : "bg-fuchsia-500";
  const accentText = isProfessional ? "text-blue-400" : "text-fuchsia-400";

  return (
    <div className="about-card mt-24">
      <h3 className="mb-2 text-2xl font-bold tracking-tight text-white">
        {copy.about.skillsHeading}
      </h3>
      <p className="mb-8 text-sm text-zinc-400">{copy.about.skillsIntro}</p>

      <div className="grid gap-6 md:grid-cols-3">
        {skillGroups.map((group) => (
          <div
            key={group.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6"
          >
            <div className="mb-1 flex items-center justify-between gap-4">
              <h4
                className={`font-mono text-sm tracking-wider uppercase transition-colors duration-300 ${accentText}`}
              >
                {group.label[locale]}
              </h4>
              <span
                className="flex gap-1"
                role="img"
                aria-label={`${LEVEL_DOTS[group.id]} / 3`}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${i < LEVEL_DOTS[group.id] ? accent : "bg-zinc-700"}`}
                  />
                ))}
              </span>
            </div>
            <p className="mb-4 text-xs text-zinc-400">{group.note[locale]}</p>
            <ul className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-zinc-800 bg-black/50 px-2.5 py-1 text-xs text-zinc-200"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
