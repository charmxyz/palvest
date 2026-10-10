import type { Metadata } from "next";
import { DM_Mono, DM_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import "@/app/globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const dmMono = DM_Mono({ variable: "--font-dm-mono", subsets: ["latin"], weight: ["300", "400", "500"] });

/** Shared <html> shell for the two root layouts: the dark creator studio and the light Pals app. */
export function RootHtml({ theme, children }: { theme: "dark" | "light"; children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(theme === "dark" && "dark", dmSans.variable, dmMono.variable, "h-full antialiased")}>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster theme={theme} position="bottom-right" />
      </body>
    </html>
  );
}

const TITLE = "Palvest — Invest in your favorite creators";
const DESCRIPTION = "Back your favorite creators' next projects before they're made, and share in what they earn.";

export const siteMetadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://palvest.xyz"),
  title: { default: TITLE, template: "%s · Palvest" },
  description: DESCRIPTION,
  applicationName: "Palvest",
  keywords: ["creators", "fans", "crowdfunding", "revenue share", "creator economy"],
  openGraph: { type: "website", siteName: "Palvest", title: TITLE, description: DESCRIPTION, url: "/" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};
