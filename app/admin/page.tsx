import type { Metadata } from "next";
import AdminForm from "@/components/admin/AdminForm";
import Stars from "@/components/birthday/Stars";
import { config } from "@/lib/config";
import { uploadsEnabled } from "@/lib/uploads";

export const metadata: Metadata = {
  title: "Create a birthday surprise",
  robots: { index: false, follow: false },
};

// Read the server's upload settings on every visit, not once at build time.
export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <main className="relative min-h-svh px-5 py-10">
      <Stars />
      <AdminForm
        uploads={uploadsEnabled()}
        needsKey={Boolean(process.env.ADMIN_KEY)}
        candles={config.candles}
      />
    </main>
  );
}
