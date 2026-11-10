import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import NavLinks from "@/components/NavLinks";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")),
  title: { default: "Codenames Arena: language models play Codenames", template: "%s · Codenames Arena" },
  description: "Claude and GPT models play Codenames against each other. Watch 1,550 refereed games, see who wins, and test yourself against their clues.",
  openGraph: { title: "Codenames Arena", description: "Four AI models, 300 games of two-team Codenames, one plain-Python referee.", type: "website" },
  twitter: { card: "summary_large_image", title: "Codenames Arena", description: "Four AI models, 300 games of two-team Codenames, one plain-Python referee." },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="brand">
              <span className="brand-mark" aria-hidden>
                <span style={{ background: "var(--red)" }} /><span style={{ background: "var(--blue)" }} />
                <span style={{ background: "var(--civ)" }} /><span style={{ background: "var(--assassin)" }} />
              </span>
              Codenames Arena
            </Link>
            <NavLinks />
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="wrap">
            Every game was refereed by plain code; no model judged another. Benchmark games ran through the Claude Code and Codex
            command-line tools in October and November 2026. <Link href="/about">How it works</Link>.
          </div>
        </footer>
      </body>
    </html>
  );
}
