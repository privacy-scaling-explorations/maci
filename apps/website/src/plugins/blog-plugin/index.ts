import { Plugin as DocusaurusPlugin } from "@docusaurus/types";
import matter from "gray-matter";

import fs from "fs";
import path from "path";

interface BlogPost {
  title: string;
  date: string;
  slug: string;
  description: string;
  authorName: string;
  tags: string[];
  excerpt: string;
}

async function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): Promise<string[]> {
  const files = await fs.promises.readdir(dirPath);

  const filePromises = files.map(async (file) => {
    const filePath = path.join(dirPath, file);
    const stat = await fs.promises.stat(filePath);

    if (stat.isDirectory()) {
      await getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  await Promise.all(filePromises);
  return arrayOfFiles;
}

export { getAllFiles };

async function loadContent(): Promise<BlogPost[]> {
  const blogDir = path.join(__dirname, "..", "..", "..", "blog");
  const files = await getAllFiles(blogDir);

  return Promise.all(
    files.map(async (filePath): Promise<BlogPost | null> => {
      const fileContent = await fs.promises.readFile(filePath, "utf-8");
      const { data } = matter(fileContent);

      if (!data.title) {
        return null;
      }

      const filename = path.basename(filePath);
      const match = filename.match(/^(\d{4}-\d{2}-\d{2})/);
      if (!match) {
        return null;
      }

      const date = match[1];
      const authorName = ((data.authors as Record<string, unknown> | undefined)?.name as string) || "";

      return {
        title: data.title as string,
        description: data.description ? (data.description as string) : "",
        date,
        slug: data.slug ? (data.slug as string) : filename.replace(/\.md$/, ""), // Use slug from front matter if available
        authorName,
        tags: data.tags ? (data.tags as string[]) : [],
        excerpt: data.excerpt ? (data.excerpt as string) : "",
      };
    }),
  ).then((posts) => posts.filter((post): post is BlogPost => post !== null));
}

export { loadContent };

export default function blogPlugin(): DocusaurusPlugin<undefined> {
  return {
    name: "blog-plugin",
  };
}
