import type { Metadata } from "next";
import { RootHtml, siteMetadata } from "@/components/root-html";

export const metadata: Metadata = siteMetadata;

export default function StudioRootLayout({ children }: { children: React.ReactNode }) {
  return <RootHtml theme="dark">{children}</RootHtml>;
}
