import type { Metadata } from "next";
import BirthdayExperience from "@/components/birthday/BirthdayExperience";
import DamagedLink from "@/components/birthday/DamagedLink";
import { resolvePageData } from "@/lib/pageData";
import { isDamagedShare } from "@/lib/shareCompactServer";

type Search = Promise<Record<string, string | string[] | undefined>>;

// The title (shown in the tab and in link previews) follows the page's language.
export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const raw = await searchParams;
  if (isDamagedShare(raw)) return { title: "Birthday link", robots: { index: false, follow: false } };

  const data = resolvePageData(raw);
  const title = `${data.ui.happyBirthday}${data.name ? ` ${data.name}` : ""} 🎂`;
  return {
    title,
    description: data.introLine,
    openGraph: { title, description: data.introLine },
    // Personal pages made with the admin form should not show up in search engines.
    robots: data.custom ? { index: false, follow: false } : undefined,
  };
}

export default async function Page({ searchParams }: { searchParams: Search }) {
  const raw = await searchParams;
  if (isDamagedShare(raw)) return <DamagedLink />;
  return <BirthdayExperience data={resolvePageData(raw)} />;
}
