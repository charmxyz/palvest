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

export const siteMetadata = {
  title: "Palvest — Invest in your favorite creators",
  description: "Back your favorite creators' next projects and share in what they earn.",
};
