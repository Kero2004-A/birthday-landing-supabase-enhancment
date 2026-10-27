"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Cake from "@/components/birthday/Cake";
import type { CandleConfig } from "@/lib/config";
import { detectLang, dirOf, dominantLang, langProps, NO_FORCE, type Force, type Lang } from "@/lib/direction";
import { LIMITS, safeUrl, toCompactJson, type DirChoice, type LangChoice, type ShareData } from "@/lib/share";

/* ------------------------------------------------------------------ */
/*  Types and helpers                                                  */
/* ------------------------------------------------------------------ */

type Photo = { id: string; src: string; caption: string };

type Form = {
  name: string;
  age: string;
  music: string;
  /** value of <input type="datetime-local">, in the creator's own time zone */
  date: string;
  letter: string;
  from: string;
  photos: Photo[];
  /** "auto" = the page reads it from the text */
  lang: LangChoice;
  dir: DirChoice;
};

type Errors = {
  name?: string;
  age?: string;
  music?: string;
  date?: string;
  letter?: string;
  from?: string;
  photos: Record<string, { src?: string; caption?: string }>;
};

const DRAFT_KEY = "birthday-admin-draft-v1";
const SITE_KEY = "birthday-admin-site-v1";

/** Addresses that only work on the computer they were typed on. */
const LOCAL_HOST = /^(localhost|127\.|0\.0\.0\.0|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;

/** The start of the finished link: scheme + host (+ any folder), no trailing slash. null = unusable. */
function cleanSite(value: string): { base: string; host: string; origin: string } | null {
  const v = value.trim();
  if (!/^https?:\/\//i.test(v)) return null;
  try {
    const u = new URL(v);
    return { base: u.origin + u.pathname.replace(/\/+$/, ""), host: u.hostname, origin: u.origin };
  } catch {
    return null;
  }
}

const uid = () => Math.random().toString(36).slice(2, 10);
const newPhoto = (): Photo => ({ id: uid(), src: "", caption: "" });
// The first photo gets a fixed id: a random one would differ between the server's HTML and the
// browser's first render and cause a hydration warning. Photos added later get random ids.
const emptyForm = (): Form => ({
  name: "",
  age: "",
  music: "",
  date: "",
  letter: "",
  from: "",
  photos: [{ id: "first", src: "", caption: "" }],
  lang: "auto",
  dir: "auto",
});

/** Read a saved draft safely. Anything unexpected falls back to an empty form. */
function readDraft(raw: string | null): Form {
  const base = emptyForm();
  if (!raw) return base;
  try {
    const d = JSON.parse(raw) as Partial<Form>;
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    const photos = Array.isArray(d.photos)
      ? d.photos
          .filter((p): p is Photo => typeof p === "object" && p !== null)
          .slice(0, LIMITS.photos)
          .map((p) => ({ id: uid(), src: str(p.src), caption: str(p.caption) }))
      : [];
    return {
      name: str(d.name),
      age: str(d.age),
      music: str(d.music),
      date: str(d.date),
      letter: str(d.letter),
      from: str(d.from),
      photos: photos.length > 0 ? photos : base.photos,
      lang: d.lang === "en" || d.lang === "ar" ? d.lang : "auto",
      dir: d.dir === "ltr" || d.dir === "rtl" ? d.dir : "auto",
    };
  } catch {
    return base;
  }
}

function validate(f: Form): Errors {
  const e: Errors = { photos: {} };

  const name = f.name.trim();
  if (!name) e.name = "Add the birthday person's name.";
  else if (name.length > LIMITS.name) e.name = `Keep the name under ${LIMITS.name} characters.`;

  const age = Number(f.age);
  if (!f.age.trim()) e.age = "Add their age. It becomes the number on the candle.";
  else if (!Number.isInteger(age) || age < 1 || age > LIMITS.age) e.age = `Use a whole number from 1 to ${LIMITS.age}.`;

  if (f.music.trim() && !safeUrl(f.music)) {
    e.music = "Use a full link starting with https:// (or a path on this site like /music/song.mp3).";
  }
  if (f.date && Number.isNaN(new Date(f.date).getTime())) e.date = "That date isn't valid.";
  if (f.letter.trim().length > LIMITS.letter) e.letter = `Keep the letter under ${LIMITS.letter} characters.`;
  if (f.from.trim().length > LIMITS.from) e.from = `Keep this under ${LIMITS.from} characters.`;

  for (const p of f.photos) {
    const pe: { src?: string; caption?: string } = {};
    if (p.src.trim() && !safeUrl(p.src)) pe.src = "Use a full image link starting with https://";
    if (p.caption.trim().length > LIMITS.caption) pe.caption = `Keep it under ${LIMITS.caption} characters.`;
    if (pe.src || pe.caption) e.photos[p.id] = pe;
  }
  return e;
}

function errorCount(e: Errors): number {
  const single = [e.name, e.age, e.music, e.date, e.letter, e.from].filter(Boolean).length;
  return single + Object.keys(e.photos).length;
}

/** The form's text values turned into what travels in the link. */
function toShare(f: Form): ShareData {
  return {
    name: f.name.trim(),
    age: Number.parseInt(f.age, 10) || null,
    music: safeUrl(f.music),
    // datetime-local has no time zone; reading it here uses the creator's, and the link stores an exact moment.
    date: f.date ? new Date(f.date).toISOString() : "",
    letter: f.letter.trim(),
    from: f.from.trim(),
    gallery: f.photos
      .map((p) => ({ src: safeUrl(p.src), caption: p.caption.trim() }))
      .filter((p) => p.src || p.caption),
    lang: f.lang,
    dir: f.dir,
  };
}

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */

const input =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-cream placeholder:text-cream/35 outline-none transition focus:border-blush aria-[invalid=true]:border-red-400";
const btn =
  "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";
const btnGhost = `${btn} border-white/15 bg-white/5 text-cream/85 hover:bg-white/10`;
const btnSolid = `${btn} border-blush bg-blush text-white hover:bg-blush-deep`;

/** The attributes that make a text field follow the language of what is typed in it. */
function fieldLang(value: string, force: Force = NO_FORCE) {
  if (value.trim() || force.lang || force.dir) return langProps(value, force.lang ?? "en", force);
  return { dir: "auto" } as const;
}

/** What the admin chose in the "Language & direction" card, so every field and badge can follow it. */
const ForceContext = createContext<Force>(NO_FORCE);

/** Shows what the page will use for this text, live: the admin's choice, or else what it detects. */
function LangBadge({ text }: { text: string }) {
  const force = useContext(ForceContext);
  const lang = force.lang ?? detectLang(text);
  const dir = force.dir ?? (lang ? dirOf(lang) : null);
  if (!lang && !dir) return <span className="text-xs text-cream/40">language: detected automatically</span>;
  const label = [lang && (lang === "ar" ? "Arabic" : "English"), dir && (dir === "rtl" ? "right-to-left" : "left-to-right")]
    .filter(Boolean)
    .join(" · ");
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-cream/80">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" />
      {label}
    </span>
  );
}

/** A small radio group made of buttons: one option is always selected. */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; lang?: string }[];
  onChange: (v: T) => void;
  hint?: string;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-sm font-semibold text-cream">{label}</legend>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              lang={o.lang}
              onClick={() => onChange(o.value)}
              className={`${btn} ${
                on ? "border-blush bg-blush text-white" : "border-white/15 bg-white/5 text-cream/85 hover:bg-white/10"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="mt-1.5 text-xs text-cream/55">{hint}</p>}
    </fieldset>
  );
}

function Card({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-deep/60 p-5 backdrop-blur md:p-7">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blush/20 text-sm font-bold text-blush">
          {n}
        </span>
        <div>
          <h2 className="font-display text-2xl font-semibold leading-tight">{title}</h2>
          {hint && <p className="mt-1 text-sm text-cream/60">{hint}</p>}
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  badgeFor,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  badgeFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-cream">
          {label}
        </label>
        {badgeFor !== undefined && <LangBadge text={badgeFor} />}
      </div>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-cream/55">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

/** A "Upload" button that sends one file to /api/upload and hands back its link. */
function UploadButton({
  kind,
  adminKey,
  onUploaded,
  onMessage,
}: {
  kind: "audio" | "image";
  adminKey: string;
  onUploaded: (url: string) => void;
  onMessage: (text: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const send = async (file: File) => {
    setBusy(true);
    onMessage("");
    try {
      const body = new FormData();
      body.set("kind", kind);
      body.set("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body,
        headers: adminKey ? { "x-admin-key": adminKey } : undefined,
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string; allowed?: string[]; maxMb?: number };
      if (res.ok && json.url) {
        onUploaded(json.url);
        return;
      }
      const reasons: Record<string, string> = {
        uploads_disabled: "Uploads are switched off on this server. Paste a link instead.",
        admin_key_required: "The upload key is missing or wrong.",
        bad_type: `That file type isn't allowed. Use: ${(json.allowed ?? []).join(", ")}.`,
        too_large: `That file is too large${json.maxMb ? ` (max ${json.maxMb} MB)` : ""}.`,
        upload_failed:
          "The server couldn't save the file. Hosts without a writable disk (like Vercel) can't store uploads, so paste a link instead.",
      };
      onMessage(reasons[json.error ?? ""] ?? "The upload didn't work. Paste a link instead.");
    } catch {
      onMessage("Couldn't reach the server. Paste a link instead.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        hidden
        accept={kind === "audio" ? ".mp3,.m4a,.aac,.ogg,.wav,audio/*" : ".jpg,.jpeg,.png,.webp,.gif,.avif,image/*"}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void send(f);
        }}
      />
      <button type="button" className={btnGhost} disabled={busy} onClick={() => fileRef.current?.click()}>
        {busy ? "Uploading…" : "Upload file"}
      </button>
    </>
  );
}

/** A tiny preview of a photo link. Hidden if the image can't load. */
function Thumb({ src }: { src: string }) {
  const [bad, setBad] = useState(false);
  const url = safeUrl(src);
  useEffect(() => setBad(false), [url]);
  if (!url || bad) {
    return <div aria-hidden className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-white/5 text-2xl">🖼️</div>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" onError={() => setBad(true)} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
  );
}

/* ------------------------------------------------------------------ */
/*  The form                                                           */
/* ------------------------------------------------------------------ */

export default function AdminForm({
  uploads,
  needsKey,
  candles,
}: {
  uploads: boolean;
  needsKey: boolean;
  /** The site's candle settings (look, colours), used for the little preview next to the age. */
  candles: CandleConfig;
}) {
  const [form, setForm] = useState<Form>(emptyForm);
  const [loaded, setLoaded] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [generated, setGenerated] = useState<{ id: string; snapshot: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [site, setSite] = useState("");
  const [copied, setCopied] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [musicNote, setMusicNote] = useState("");
  const [photoNotes, setPhotoNotes] = useState<Record<string, string>>({});

  const resultRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLTextAreaElement>(null);

  // Restore the last draft, so a refresh doesn't lose a long letter.
  useEffect(() => {
    try {
      setForm(readDraft(localStorage.getItem(DRAFT_KEY)));
    } catch {
      /* private window: start empty */
    }
    // The link starts with the address of the page you are on, unless you changed it before.
    let savedSite = "";
    try {
      savedSite = localStorage.getItem(SITE_KEY) ?? "";
    } catch {
      /* ignore */
    }
    setSite(savedSite || window.location.origin);
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(SITE_KEY, site);
    } catch {
      /* ignore */
    }
  }, [site, loaded]);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      /* ignore */
    }
  }, [form, loaded]);

  const errors = useMemo(() => validate(form), [form]);
  const snapshot = useMemo(() => JSON.stringify(form), [form]);
  const stale = generated !== null && generated.snapshot !== snapshot;

  // What language the finished page will pick, from the same texts it will look at.
  const pageLang: Lang | null = useMemo(() => {
    const texts = [form.name, form.letter, ...form.photos.map((p) => p.caption)].filter((t) => t.trim());
    return texts.some((t) => detectLang(t)) ? dominantLang(texts) : null;
  }, [form.name, form.letter, form.photos]);

  // What the admin picked (null = automatic), and what the finished page will therefore use.
  const force: Force = useMemo(
    () => ({ lang: form.lang === "auto" ? null : form.lang, dir: form.dir === "auto" ? null : form.dir }),
    [form.lang, form.dir],
  );
  const effLang: Lang | null = force.lang ?? pageLang;
  const effDir = force.dir ?? (effLang ? dirOf(effLang) : null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setPhoto = (id: string, patch: Partial<Photo>) =>
    setForm((f) => ({ ...f, photos: f.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  const movePhoto = (index: number, by: -1 | 1) =>
    setForm((f) => {
      const photos = [...f.photos];
      const to = index + by;
      if (to < 0 || to >= photos.length) return f;
      [photos[index], photos[to]] = [photos[to], photos[index]];
      return { ...f, photos };
    });
  const removePhoto = (id: string) =>
    setForm((f) => {
      const photos = f.photos.filter((p) => p.id !== id);
      return { ...f, photos: photos.length > 0 ? photos : [newPhoto()] };
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    if (errorCount(errors) > 0) {
      // Jump to the first problem.
      requestAnimationFrame(() => {
        const bad = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        bad?.scrollIntoView({ behavior: "smooth", block: "center" });
        bad?.focus({ preventScroll: true });
      });
      return;
    }
    // Same form values as the last link: reuse it instead of storing a duplicate row.
    if (generated && generated.snapshot === snapshot) return;

    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(adminKey ? { "x-admin-key": adminKey } : {}) },
        body: toCompactJson(toShare(form)),
      });
      const json = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (res.ok && json.id) {
        setGenerated({ id: json.id, snapshot });
        setCopied(false);
        requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
        return;
      }
      const reasons: Record<string, string> = {
        supabase_not_configured: "Supabase isn't set up on this server yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        admin_key_not_set: "Set ADMIN_KEY on the server first. Without it, nobody is allowed to create links.",
        admin_key_required: "The admin key is missing or wrong.",
        too_large: "This is too much text for one link. Shorten the letter or the captions.",
        bad_request: "The server couldn't read the form. Reload the page and try again.",
        save_failed: "The server couldn't save the page. Check the Supabase table and keys, then try again.",
      };
      setCreateError(reasons[json.error ?? ""] ?? "Couldn't create the link. Try again.");
    } catch {
      setCreateError("Couldn't reach the server. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Older browsers / blocked clipboard: select the text and use the old way.
      linkRef.current?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    if (!window.confirm("Clear the whole form?")) return;
    setForm(emptyForm());
    setGenerated(null);
    setShowErrors(false);
    setMusicNote("");
    setPhotoNotes({});
  };

  const shown = showErrors ? errors : ({ photos: {} } as Errors);
  const musicUrl = safeUrl(form.music);
  const dateInPast = form.date !== "" && new Date(form.date).getTime() < Date.now();
  const siteInfo = cleanSite(site);
  const link = generated && siteInfo ? `${siteInfo.base}/b/${generated.id}` : "";
  // Files uploaded here live on this server, so a link pointing somewhere else can't find them.
  const usesUploaded = [form.music, ...form.photos.map((p) => p.src)].some((v) => v.trim().startsWith("/api/files/"));
  const onOtherSite = Boolean(generated && siteInfo && siteInfo.origin !== window.location.origin);
  const ageNumber = Number(form.age);
  const previewAge =
    form.age.trim() !== "" && Number.isInteger(ageNumber) && ageNumber >= 1 && ageNumber <= LIMITS.age ? ageNumber : null;

  return (
    <div className="relative mx-auto max-w-6xl">
      <header className="mb-8">
        <p className="font-hand text-3xl text-gold">birthday surprise</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">Create a link</h1>
        <p className="mt-2 max-w-2xl text-cream/65">
          Fill this in, press <strong className="font-semibold text-cream">Generate link</strong>, and send the link. Write in English or
          Arabic: the page switches direction and fonts by itself, or you can choose the language and direction yourself near the end.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <ForceContext.Provider value={force}>
        <form onSubmit={submit} noValidate className="space-y-6">
          {/* ---------- 1 · The birthday ---------- */}
          <Card n={1} title="The birthday" hint="Who it's for and the number on the cake.">
            <Field id="name" label="Name" error={shown.name} badgeFor={form.name}>
              <input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Sara   ·   سارة"
                autoComplete="off"
                maxLength={LIMITS.name + 20}
                aria-invalid={Boolean(shown.name)}
                aria-describedby={shown.name ? "name-error" : undefined}
                className={`${input} text-start`}
                {...fieldLang(form.name, force)}
              />
            </Field>

            <div className="flex flex-wrap items-center gap-6">
              <div className="min-w-0 flex-1 basis-56">
            <Field
              id="age"
              label="Age (the number on the candle)"
              hint={`22 shows a "2" and a "2". Works from 1 to ${LIMITS.age}.`}
              error={shown.age}
            >
              <input
                id="age"
                type="number"
                inputMode="numeric"
                min={1}
                max={LIMITS.age}
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
                placeholder="22"
                aria-invalid={Boolean(shown.age)}
                aria-describedby={shown.age ? "age-error" : undefined}
                className={`${input} max-w-[10rem]`}
              />
            </Field>
              </div>
              {previewAge !== null && (
                <div dir="ltr" className="w-40 shrink-0">
                  <Cake candles={{ ...candles, age: previewAge }} label={`Candle preview: ${previewAge}`} />
                </div>
              )}
            </div>
          </Card>

          {/* ---------- 2 · Music ---------- */}
          <Card n={2} title="Music" hint="Plays when the candles are lit. The page gets a play / pause button.">
            <Field
              id="music"
              label="Song link"
              hint="A direct link to an audio file (.mp3, .m4a, .ogg, .wav). Links to YouTube or Spotify pages won't play. Leave it empty for no music."
              error={shown.music}
            >
              <div className="flex flex-wrap gap-2">
                <input
                  id="music"
                  type="url"
                  dir="ltr"
                  value={form.music}
                  onChange={(e) => {
                    set("music", e.target.value);
                    setMusicNote("");
                  }}
                  placeholder="https://example.com/song.mp3"
                  autoComplete="off"
                  aria-invalid={Boolean(shown.music)}
                  aria-describedby={shown.music ? "music-error" : undefined}
                  className={`${input} min-w-0 flex-1`}
                />
                {uploads && (
                  <UploadButton
                    kind="audio"
                    adminKey={adminKey}
                    onUploaded={(url) => {
                      set("music", url);
                      setMusicNote("Uploaded ✓");
                    }}
                    onMessage={setMusicNote}
                  />
                )}
              </div>
            </Field>
            {musicNote && (
              <p role="status" className="text-sm text-gold">
                {musicNote}
              </p>
            )}
            {musicUrl && (
              <audio controls preload="none" src={musicUrl} className="h-10 w-full max-w-md">
                Your browser can't play this preview.
              </audio>
            )}
            {!uploads && (
              <p className="text-xs text-cream/45">
                File uploads are switched off on this server. To turn them on, set ENABLE_UPLOADS=true (see README).
              </p>
            )}
          </Card>

          {/* ---------- 3 · Photos ---------- */}
          <Card n={3} title="Photos & memories" hint={`One card per photo, with a few words about it. Up to ${LIMITS.photos}.`}>
            <ul className="space-y-4">
              {form.photos.map((p, i) => {
                const pe = shown.photos[p.id] ?? {};
                return (
                  <li key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-cream/80">Photo {i + 1}</span>
                      <div className="flex gap-1.5">
                        <button type="button" aria-label="Move up" className={btnGhost} disabled={i === 0} onClick={() => movePhoto(i, -1)}>
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          className={btnGhost}
                          disabled={i === form.photos.length - 1}
                          onClick={() => movePhoto(i, 1)}
                        >
                          ↓
                        </button>
                        <button type="button" aria-label={`Remove photo ${i + 1}`} className={btnGhost} onClick={() => removePhoto(p.id)}>
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Thumb src={p.src} />
                      <div className="min-w-0 flex-1 space-y-3">
                        <Field id={`src-${p.id}`} label="Image link" error={pe.src}>
                          <div className="flex flex-wrap gap-2">
                            <input
                              id={`src-${p.id}`}
                              type="url"
                              dir="ltr"
                              value={p.src}
                              onChange={(e) => {
                                setPhoto(p.id, { src: e.target.value });
                                setPhotoNotes((n) => ({ ...n, [p.id]: "" }));
                              }}
                              placeholder="https://example.com/photo.jpg"
                              autoComplete="off"
                              aria-invalid={Boolean(pe.src)}
                              aria-describedby={pe.src ? `src-${p.id}-error` : undefined}
                              className={`${input} min-w-0 flex-1`}
                            />
                            {uploads && (
                              <UploadButton
                                kind="image"
                                adminKey={adminKey}
                                onUploaded={(url) => {
                                  setPhoto(p.id, { src: url });
                                  setPhotoNotes((n) => ({ ...n, [p.id]: "Uploaded ✓" }));
                                }}
                                onMessage={(m) => setPhotoNotes((n) => ({ ...n, [p.id]: m }))}
                              />
                            )}
                          </div>
                        </Field>
                        {photoNotes[p.id] && (
                          <p role="status" className="text-sm text-gold">
                            {photoNotes[p.id]}
                          </p>
                        )}

                        <Field id={`cap-${p.id}`} label="Description" error={pe.caption} badgeFor={p.caption}>
                          <textarea
                            id={`cap-${p.id}`}
                            rows={2}
                            value={p.caption}
                            onChange={(e) => setPhoto(p.id, { caption: e.target.value })}
                            placeholder="Our first trip together…   ·   أول رحلة لنا معًا…"
                            aria-invalid={Boolean(pe.caption)}
                            aria-describedby={pe.caption ? `cap-${p.id}-error` : undefined}
                            className={`${input} resize-y text-start`}
                            {...fieldLang(p.caption, force)}
                          />
                        </Field>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              className={btnGhost}
              disabled={form.photos.length >= LIMITS.photos}
              onClick={() => setForm((f) => ({ ...f, photos: [...f.photos, newPhoto()] }))}
            >
              + Add another photo
            </button>
            {form.photos.length >= LIMITS.photos && <p className="text-xs text-cream/55">That's the maximum of {LIMITS.photos} photos.</p>}
          </Card>

          {/* ---------- 4 · Reveal date ---------- */}
          <Card n={4} title="Reveal date" hint="Until then the page stays blurred behind a live countdown. Leave empty to open straight away.">
            <Field id="date" label="Opens on" error={shown.date}>
              <input
                id="date"
                type="datetime-local"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                aria-invalid={Boolean(shown.date)}
                aria-describedby={shown.date ? "date-error" : undefined}
                className={`${input} max-w-xs [color-scheme:dark]`}
              />
            </Field>
            <p className="text-xs text-cream/55">
              Uses the time zone of this device. The link stores the exact moment, so it opens at the same instant for everyone.
              It runs on the viewer&apos;s clock and is a surprise, not a lock.
            </p>
            {dateInPast && <p className="text-sm text-gold">That moment has already passed, so the page will open straight away.</p>}
          </Card>

          {/* ---------- 5 · Letter ---------- */}
          <Card n={5} title="The letter" hint="Opens from an envelope at the end. A blank line starts a new paragraph.">
            <Field id="letter" label="Your message" error={shown.letter} badgeFor={form.letter}>
              <textarea
                id="letter"
                rows={14}
                value={form.letter}
                onChange={(e) => set("letter", e.target.value)}
                placeholder={"Happy birthday!\n\nI wanted to tell you…\n\n—\n\nكل عام وأنت بخير…"}
                aria-invalid={Boolean(shown.letter)}
                aria-describedby={shown.letter ? "letter-error" : undefined}
                className={`${input} resize-y text-start leading-relaxed`}
                {...fieldLang(form.letter, force)}
              />
              <div className="mt-1.5 text-end text-xs text-cream/45" dir="ltr">
                {form.letter.trim().length} / {LIMITS.letter}
              </div>
            </Field>

            <Field id="from" label="Signed by (optional)" error={shown.from} badgeFor={form.from}>
              <input
                id="from"
                value={form.from}
                onChange={(e) => set("from", e.target.value)}
                placeholder="Ahmed   ·   أحمد"
                autoComplete="off"
                aria-invalid={Boolean(shown.from)}
                aria-describedby={shown.from ? "from-error" : undefined}
                className={`${input} max-w-sm text-start`}
                {...fieldLang(form.from, force)}
              />
            </Field>
          </Card>

          {/* ---------- 6 · Language & direction ---------- */}
          <Card
            n={6}
            title="Language & direction"
            hint="Leave both on Automatic and the page reads your name, letter and captions. Or choose them yourself."
          >
            <Segmented<LangChoice>
              label="Language of the page"
              value={form.lang}
              onChange={(v) => set("lang", v)}
              options={[
                { value: "auto", label: "Automatic" },
                { value: "en", label: "English", lang: "en" },
                { value: "ar", label: "العربية", lang: "ar" },
              ]}
              hint="Sets the wording the page uses itself: the countdown, buttons, greeting and the letter's heading."
            />
            <Segmented<DirChoice>
              label="Text direction"
              value={form.dir}
              onChange={(v) => set("dir", v)}
              options={[
                { value: "auto", label: "Automatic" },
                { value: "ltr", label: "Left to right" },
                { value: "rtl", label: "Right to left" },
              ]}
              hint="Which way the text flows, and which side things sit on. Automatic follows the language."
            />
            <p className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-cream/75">
              {effLang || effDir ? (
                <>
                  The page will be{" "}
                  <strong className="font-semibold text-cream">
                    {[effLang && (effLang === "ar" ? "Arabic" : "English"), effDir && (effDir === "rtl" ? "right-to-left" : "left-to-right")]
                      .filter(Boolean)
                      .join(" · ")}
                  </strong>
                  .
                </>
              ) : (
                "Nothing typed yet, so the page will decide once there is text."
              )}
            </p>
          </Card>

          {needsKey && (
            <Card n={7} title="Admin key" hint="This server asks for a key before it creates links or accepts uploads.">
              <Field id="adminKey" label="Key">
                <input
                  id="adminKey"
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  autoComplete="off"
                  className={`${input} max-w-sm`}
                />
              </Field>
            </Card>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={creating}
              className={`${btnSolid} !px-8 !py-3.5 text-base shadow-[0_0_28px_rgba(255,123,156,0.4)]`}
            >
              {creating ? "Creating…" : "Generate link"}
            </button>
            <button type="button" className={btnGhost} onClick={reset}>
              Start over
            </button>
            {createError && (
              <p role="alert" className="text-sm text-red-300">
                {createError}
              </p>
            )}
            {showErrors && errorCount(errors) > 0 && (
              <p role="alert" className="text-sm text-red-300">
                Fix the highlighted {errorCount(errors) === 1 ? "field" : "fields"} first.
              </p>
            )}
          </div>
        </form>
        </ForceContext.Provider>

        {/* ---------- Result ---------- */}
        <aside ref={resultRef} className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl border border-white/10 bg-deep/70 p-5 backdrop-blur md:p-7">
            <h2 className="font-display text-2xl font-semibold">Your link</h2>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
              <span className="text-cream/65">The page will be in</span>
              {effLang || effDir ? (
                <strong className="font-semibold text-cream">
                  {[effLang && (effLang === "ar" ? "Arabic" : "English"), effDir && (effDir === "rtl" ? "right-to-left" : "left-to-right")]
                    .filter(Boolean)
                    .join(" · ")}
                </strong>
              ) : (
                <span className="text-cream/45">decided once you type</span>
              )}
            </div>

            <div className="mt-4">
              <label htmlFor="site" className="mb-1.5 block text-sm font-semibold text-cream">
                Address of your site
              </label>
              <input
                id="site"
                type="url"
                dir="ltr"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                placeholder="https://my-surprise.vercel.app"
                autoComplete="off"
                aria-invalid={site.trim() !== "" && !siteInfo}
                className={`${input} text-sm`}
              />
              {site.trim() !== "" && !siteInfo ? (
                <p role="alert" className="mt-1.5 text-sm text-red-300">
                  Start with https:// (or http:// for a test).
                </p>
              ) : siteInfo && LOCAL_HOST.test(siteInfo.host) ? (
                <p className="mt-1.5 text-xs text-gold">
                  That address is this computer, so only you can open the link. Put your real site address here before you send it.
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-cream/50">The link starts with this. It's filled in from the page you're on.</p>
              )}
            </div>

            {!generated ? (
              <p className="mt-5 text-cream/60">
                Press <strong className="font-semibold text-cream">Generate link</strong> and your link appears here, ready to copy.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {stale && (
                  <p role="status" className="rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold">
                    You changed the form after making this link. Press Generate link again to update it.
                  </p>
                )}
                <textarea
                  ref={linkRef}
                  readOnly
                  dir="ltr"
                  rows={2}
                  value={link}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Your shareable link"
                  className="w-full resize-none rounded-xl border border-white/15 bg-abyss/80 p-3 font-mono text-xs leading-relaxed text-cream/90 outline-none focus:border-blush"
                />
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={copy} disabled={!link} className={btnSolid}>
                    {copied ? "Copied ✓" : "Copy link"}
                  </button>
                  {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer" className={btnGhost}>
                      Open preview ↗
                    </a>
                  ) : null}
                </div>
                {usesUploaded && onOtherSite && (
                  <p className="text-sm text-gold">
                    Your uploaded files are stored on this server ({window.location.origin}), and a link with a different address
                    can&apos;t find them. Use this server&apos;s address above, or paste links to files that are already online.
                  </p>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
