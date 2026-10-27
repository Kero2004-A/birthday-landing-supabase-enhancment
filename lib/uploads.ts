/**
 * Shared settings for the optional upload API (app/api/upload and app/api/files).
 *
 * When Supabase is configured, uploads go to Supabase Storage and the public URL is used.
 * Otherwise they save files into the `uploads/` folder next to the app and serve them back from
 * /api/files/<random-id>.<ext>. That needs a server with a disk that keeps its files
 * (your own computer, a VPS, Railway/Render with a volume). Hosts like Vercel have no
 * writable disk, so there you paste links instead.
 *
 * Switches (environment variables):
 *   ENABLE_UPLOADS=true   turn uploads on in production (they are always on in `npm run dev`)
 *   ADMIN_KEY=something   the form must send this key before it may upload. In production,
 *                         uploads stay OFF unless this is set too, so a public server can
 *                         never be left open for anyone to fill its disk.
 *   UPLOAD_DIR=/data      where to keep the files (default: ./uploads)
 */
import path from "node:path";
import { supabaseConfigured } from "./supabase";

export const MB = 1024 * 1024;

export type UploadKind = "audio" | "image";

/** Allowed extensions and the Content-Type we serve them with (we never trust the browser's). No SVG on purpose. */
export const KINDS: Record<UploadKind, { max: number; types: Record<string, string> }> = {
  audio: {
    max: 15 * MB,
    types: { mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", ogg: "audio/ogg", wav: "audio/wav" },
  },
  image: {
    max: 8 * MB,
    types: {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      avif: "image/avif",
    },
  },
};

export const MIME: Record<string, string> = { ...KINDS.audio.types, ...KINDS.image.types };

/** The only file names we will ever read back: a random UUID plus an allowed extension. */
export const FILE_NAME = new RegExp(
  `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(${Object.keys(MIME).join("|")})$`
);

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

export function uploadsEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (!process.env.ADMIN_KEY) return false;
  // Supabase Storage needs no disk, so it is safe on Vercel too. The local disk still needs ENABLE_UPLOADS.
  return supabaseConfigured() || process.env.ENABLE_UPLOADS === "true";
}
