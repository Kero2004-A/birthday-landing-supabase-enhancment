import Stars from "./Stars";

/**
 * Shown when a link's compact part is cut off or damaged (see isDamagedShare). The sender's
 * language isn't known any more, so the message is given in both English and Arabic.
 */
export default function DamagedLink() {
  return (
    <main className="relative grid min-h-svh place-items-center px-6 py-16 text-center">
      <Stars />
      <div className="max-w-md space-y-10">
        <section lang="en" dir="ltr" className="space-y-3">
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">This link is incomplete</h1>
          <p className="text-cream/75">
            Part of it was probably cut off when it was sent. Ask the sender for the full link, or to send it again.
          </p>
        </section>
        <section lang="ar" dir="rtl" className="space-y-3">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">هذا الرابط غير مكتمل</h2>
          <p className="text-cream/75">
            ربما انقطع جزء منه أثناء الإرسال. اطلب من المرسل الرابط كاملًا، أو أن يعيد إرساله.
          </p>
        </section>
      </div>
    </main>
  );
}
