/**
 * Every fixed piece of text on the landing page, in English and Arabic.
 * The page picks the set automatically from the language of what you wrote
 * (name, letter, captions), so there is no language switch anywhere.
 *
 * "{name}" and "{n}" are filled in with fill().
 * Edit the Arabic here if you want different wording.
 */
import type { Lang } from "./direction";

export type Ui = {
  introLine: string;
  comingTitle: string;
  /** Same, for a link that has no name. */
  comingTitleNoName: string;
  opens: string;
  readyTitle: string;
  openIt: string;
  startsIn: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  happyBirthday: string;
  makeWish: string;
  lightBtn: string;
  closeEyes: string;
  blowBtn: string;
  wishOnWay: string;
  seeMemories: string;
  galleryKicker: string;
  galleryTitle: string;
  letterKicker: string;
  /** Heading of the "open your letter" section. */
  letterHeading: string;
  openLetter: string;
  /** Title printed at the top of the letter itself. */
  letterTitle: string;
  greeting: string;
  signOff: string;
  close: string;
  footer: string;
  footerNoName: string;
  musicPlay: string;
  musicPause: string;
  memoryAlt: string;
  cakeAlt: string;
  /** Locale used to print the reveal date. Latin digits, so it matches the countdown numbers. */
  locale: string;
};

export const UI: Record<Lang, Ui> = {
  en: {
    introLine: "Someone made something for you",
    comingTitle: "Something special is coming, {name}",
    comingTitleNoName: "Something special is coming",
    opens: "Opens",
    readyTitle: "Ready for your surprise?",
    openIt: "Open it ✨",
    startsIn: "Your surprise begins in",
    days: "Days",
    hours: "Hours",
    minutes: "Minutes",
    seconds: "Seconds",
    happyBirthday: "Happy Birthday",
    makeWish: "Make a wish, then light the candles.",
    lightBtn: "🕯️ Light the candles",
    closeEyes: "Close your eyes, make a wish… and blow them out.",
    blowBtn: "🌬️ Blow them out",
    wishOnWay: "Your wish is on its way ✨",
    seeMemories: "See your memories",
    galleryKicker: "a little look back",
    galleryTitle: "Our favourite moments",
    letterKicker: "one last thing…",
    letterHeading: "There's a letter for you",
    openLetter: "Open your letter",
    letterTitle: "Happy Birthday!",
    greeting: "Dear {name},",
    signOff: "With all my love,",
    close: "Close with a smile 😊",
    footer: "Made with ❤️ just for {name}",
    footerNoName: "Made with ❤️ just for you",
    musicPlay: "Play music",
    musicPause: "Pause music",
    memoryAlt: "Memory {n}",
    cakeAlt: "A birthday cake with a number {n} candle",
    locale: "en",
  },
  ar: {
    introLine: "شخص ما صنع لك شيئًا",
    comingTitle: "شيء مميز في الطريق إليك يا {name}",
    comingTitleNoName: "شيء مميز في الطريق إليك",
    opens: "تُفتح المفاجأة في",
    readyTitle: "مفاجأتك جاهزة",
    openIt: "فتح المفاجأة ✨",
    startsIn: "مفاجأتك تبدأ بعد",
    days: "أيام",
    hours: "ساعات",
    minutes: "دقائق",
    seconds: "ثوانٍ",
    happyBirthday: "عيد ميلاد سعيد",
    makeWish: "هيا نتمنّى أمنية، ثم نُشعل الشموع.",
    lightBtn: "🕯️ إشعال الشموع",
    closeEyes: "هيا نُغمض أعيننا ونتمنّى أمنية… ثم نُطفئ الشموع.",
    blowBtn: "🌬️ إطفاء الشموع",
    wishOnWay: "أمنيتك في طريقها إليك ✨",
    seeMemories: "الذكريات",
    galleryKicker: "نظرة إلى الوراء",
    galleryTitle: "أجمل لحظاتنا",
    letterKicker: "وشيء أخير…",
    letterHeading: "هناك رسالة لك",
    openLetter: "فتح الرسالة",
    letterTitle: "عيد ميلاد سعيد!",
    greeting: "إلى {name}،",
    signOff: "مع كل الحب،",
    close: "إغلاق بابتسامة 😊",
    footer: "صُنع بحبّ ❤️ من أجل {name}",
    footerNoName: "صُنع بحبّ ❤️ من أجلك",
    musicPlay: "تشغيل الموسيقى",
    musicPause: "إيقاف الموسيقى مؤقتًا",
    memoryAlt: "ذكرى {n}",
    cakeAlt: "كعكة عيد ميلاد عليها شمعة بالرقم {n}",
    locale: "ar-EG-u-nu-latn",
  },
};

/** Fill "{name}" / "{n}" placeholders. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => (key in values ? String(values[key]) : m));
}
