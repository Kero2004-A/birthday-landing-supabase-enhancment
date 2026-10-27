import type { Metadata } from "next";
import { cache } from "react";
import BirthdayExperience from "@/components/birthday/BirthdayExperience";
import DamagedLink from "@/components/birthday/DamagedLink";
import { pageDataFromShare } from "@/lib/pageData";
import { loadShare } from "@/lib/shareStore";

// A page can be created at any time, so always read it from the database.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

// generateMetadata and the page both need the row; cache() makes it one query per request.
const getShare = cache(loadShare);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const share = await getShare(id);
  if (!share) return { title: "Birthday link", robots: { index: false, follow: false } };

  const data = pageDataFromShare(share);
  const title = `${data.ui.happyBirthday}${data.name ? ` ${data.name}` : ""} 🎂`;
  return {
    title,
    description: data.introLine,
    openGraph: { title, description: data.introLine },
    robots: { index: false, follow: false },
  };
}

export default async function SharedPage({ params }: Props) {
  const { id } = await params;
  const share = await getShare(id);
  // Unknown or mistyped id: the bilingual "this link is incomplete" page.
  if (!share) return <DamagedLink />;
  return <BirthdayExperience data={pageDataFromShare(share)} />;
}
