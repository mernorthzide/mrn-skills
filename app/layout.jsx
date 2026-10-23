import { Anuphan, Noto_Sans_Thai_Looped, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const ui = Anuphan({ subsets: ["thai", "latin"], weight: ["300", "400", "500", "600"], variable: "--font-ui" });
const read = Noto_Sans_Thai_Looped({ subsets: ["thai", "latin"], weight: ["400", "600"], variable: "--font-read" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata = {
  title: "MRN Skills",
  description: "skill ของทีมสำหรับ Claude Code คัดลอก prompt เดียวไปวาง Claude ติดตั้งให้ แล้ว skill ใหม่ตามมาเอง",
};

export const viewport = { themeColor: "#05060a" };

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${ui.variable} ${read.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
