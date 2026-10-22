import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const font = IBM_Plex_Sans_Arabic({ subsets: ["arabic", "latin"], weight: ["400", "500", "700"], variable: "--font-ar" });

export const metadata: Metadata = {
  title: { default: "MenU | قوائم مطاعم الأردن", template: "%s | MenU" },
  description: "تصفح قوائم المطاعم في الأردن وابحث عن وجبتك.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={font.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
