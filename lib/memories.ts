import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "./frontmatter";
import type { Memory } from "./config";

/**
 * Server-only. Builds the memory list from folders inside /public/memories.
 *
 *   public/memories/
 *     01-the-beginning/
 *       photo.jpg        <- first image in the folder is used
 *       memory.md        <- optional front matter + the message
 *     02-road-trip/
 *       ...
 *
 * Folders are shown in name order (01, 02, 10 ...). Folders starting with "_" or "." are ignored.
 */

const ROOT = path.join(process.cwd(), "public", "memories");
const IMAGE = /\.(jpe?g|png|webp|gif|avif)$/i;
const TEXT = /\.(md|txt)$/i;

function titleFromFolder(folder: string) {
  const clean = folder.replace(/^\d+[\s._-]*/, "").replace(/[-_]+/g, " ").trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : folder;
}

export function loadMemories(): Memory[] {
  try {
    if (!fs.existsSync(ROOT)) return [];

    const folders = fs
      .readdirSync(ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !/^[._]/.test(d.name))
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const memories: Memory[] = [];

    for (const folder of folders) {
      const files = fs.readdirSync(path.join(ROOT, folder)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      const image = files.find((f) => IMAGE.test(f));
      const textFile = files.find((f) => TEXT.test(f));
      if (!image && !textFile) continue;

      const { meta, body } = textFile
        ? parseFrontmatter(fs.readFileSync(path.join(ROOT, folder, textFile), "utf8"))
        : { meta: {} as Record<string, string>, body: "" };

      memories.push({
        title: meta.title || titleFromFolder(folder),
        date: meta.date,
        emoji: meta.emoji,
        message: body,
        src: image ? `/memories/${encodeURIComponent(folder)}/${encodeURIComponent(image)}` : undefined,
      });
    }

    return memories;
  } catch (err) {
    console.warn("[birthday] could not read public/memories:", err);
    return [];
  }
}
