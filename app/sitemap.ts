import type { MetadataRoute } from "next";
import { projectsData } from "./lib/data";

// Next.js の動的サイトマップ生成
// https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://burst.style";

  // プロジェクト個別ページを動的に生成
  const projectEntries: MetadataRoute.Sitemap = projectsData.map((project) => ({
    url: `${baseUrl}/projects/${project.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    ...projectEntries,
  ];
}
