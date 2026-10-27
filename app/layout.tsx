import type { Metadata, Viewport } from "next";
import { Amiri, Cairo, Caveat, Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
});
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });
// Arabic: Cairo for body text, Amiri for headings and the handwritten lines. The page switches
// to them automatically when the text is Arabic (see the ":lang(ar)" rules in globals.css).
// preload: false, so English pages do not download the Arabic fonts; they load only when Arabic text appears.
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", preload: false });
const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  preload: false,
});

export const metadata: Metadata = {
  title: "Happy Birthday! 🎂",
  description: "A little surprise, made just for you.",
};

export const viewport: Viewport = {
  themeColor: "#00274a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${manrope.variable} ${caveat.variable} ${cairo.variable} ${amiri.variable}`}
    >
      <body className="min-h-svh antialiased">{children}</body>
    </html>
  );
}
