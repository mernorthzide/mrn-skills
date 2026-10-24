import { Anuphan, Noto_Sans_Thai_Looped, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { t } from "../lib/i18n.mjs";

const ui = Anuphan({ subsets: ["thai", "latin"], weight: ["300", "400", "500", "600"], variable: "--font-ui" });
const read = Noto_Sans_Thai_Looped({ subsets: ["thai", "latin"], weight: ["400", "600"], variable: "--font-read" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

// Each language is its own root layout (app/(en), app/(th)), so <html lang> is right on every exported page.
export const rootMetadata = (lang) => ({ title: "MRN Skills", description: t[lang].description });

export const viewport = { themeColor: "#05060a" };

export default function Root({ lang, children }) {
  return (
    <html lang={lang} className={`${ui.variable} ${read.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
