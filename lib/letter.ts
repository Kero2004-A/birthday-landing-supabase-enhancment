import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "./frontmatter";
import type { LetterData } from "./config";

/**
 * Server-only. Reads content/letter.md (kept outside /public, so it is not
 * a downloadable file). Returns null if the file is missing or empty.
 */
export function letterFromFile(): LetterData | null {
  try {
    const file = path.join(process.cwd(), "content", "letter.md");
    if (!fs.existsSync(file)) return null;

    const { meta, body } = parseFrontmatter(fs.readFileSync(file, "utf8"));
    const paragraphs = body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (paragraphs.length === 0) return null;

    return {
      title: meta.title || "Happy Birthday!",
      greeting: meta.greeting || "Dear {name},",
      paragraphs,
      signOff: meta.signoff ?? "With all my love,",
      from: meta.from ?? "",
    };
  } catch (err) {
    console.warn("[birthday] could not read content/letter.md:", err);
    return null;
  }
}
