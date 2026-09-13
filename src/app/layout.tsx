import type { Metadata } from "next";
import { Big_Shoulders, IBM_Plex_Mono, Noto_Sans_Devanagari, Schibsted_Grotesk, Teko } from "next/font/google";
import { LangProvider } from "@/components/lang-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LOCALE } from "@/lib/i18n/config";
import { getLang } from "@/lib/i18n/server";
import "./globals.css";

const display = Big_Shoulders({ variable: "--font-big-shoulders", subsets: ["latin"], weight: ["700", "900"] });
const body = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin"] });
const mono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });
// Devanagari faces sit behind the Latin ones in each stack, so they only load for Hindi text.
const hindiBody = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"], preload: false });
const hindiDisplay = Teko({ variable: "--font-devanagari-display", subsets: ["devanagari"], weight: ["600", "700"], preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  openGraph: { siteName: "Techify", images: ["/api/og"] },
  title: {
    default: "Techify: the right laptop or phone for your budget",
    template: "%s · Techify",
  },
  description:
    "Tell Techify your budget and what you'll use it for. It ranks laptops and phones in India by how well their real specs fit, and explains why.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  const fonts = [display, body, mono, hindiBody, hindiDisplay].map((f) => f.variable).join(" ");
  return (
    <html lang={LOCALE[lang]} className={`${fonts} h-full antialiased`}>
      <body className="flex min-h-full flex-col [--gutter:1rem] sm:[--gutter:1.5rem]">
        <LangProvider lang={lang}>
          <TooltipProvider delayDuration={150}>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </TooltipProvider>
        </LangProvider>
      </body>
    </html>
  );
}
