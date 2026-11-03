import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import Brand from "@/components/Brand";
import { getLocale } from "@/lib/i18n";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const font = IBM_Plex_Sans_Arabic({ subsets: ["arabic", "latin"], weight: ["400", "500", "700"], variable: "--font-ar" });

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: {
      default: locale === "ar" ? "MenU | قوائم مطاعم الأردن" : "MenU | Restaurant Menus in Jordan",
      template: "%s | MenU",
    },
    description: locale === "ar"
      ? "تصفح قوائم المطاعم في الأردن وابحث عن وجبتك."
      : "Browse restaurant menus in Jordan and find your next meal.",
    verification: {
      google: "Vq3G3yo5NWyP3Khtjt6mW-7dV5BGB3390ML4l48rpMY",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={font.variable}>
      <body className="font-sans antialiased">
        <Brand locale={locale} />
        {children}
      </body>
    </html>
  );
}
