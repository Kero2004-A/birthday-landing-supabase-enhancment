/**
 * Tiny front matter parser (no dependencies).
 *
 *   ---
 *   title: Something
 *   ---
 *   Body text...
 */
export function parseFrontmatter(raw: string) {
  const text = raw.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const meta: Record<string, string> = {};
  let body = text;

  if (text.startsWith("---\n")) {
    const end = text.indexOf("\n---", 4);
    if (end !== -1) {
      for (const line of text.slice(4, end).split("\n")) {
        const i = line.indexOf(":");
        if (i === -1) continue;
        const key = line.slice(0, i).trim().toLowerCase();
        const value = line
          .slice(i + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
        if (key) meta[key] = value;
      }
      body = text.slice(end + 4).replace(/^\n/, "");
    }
  }
  return { meta, body: body.trim() };
}
