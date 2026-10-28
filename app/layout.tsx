import type { Metadata } from "next";
import { Header, Footer } from "@/components/shell";
import "./globals.css";
import "./editorial.css";
import { newsreader, sourceSerif, sourceSans, plexMono } from "./fonts";
export const metadata: Metadata = {
  title: {
    default: "The Signal — Technology, without the noise",
    template: "%s · The Signal",
  },
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3100"),
  openGraph: {
    type: "website",
    siteName: "The Signal",
    title: "The Signal — An independent technology newspaper",
    description:
      "Technology, people, and the world between. Source-linked reporting and intelligence.",
  },
  description:
    "An independent, automated technology briefing with cybersecurity intelligence, official service status, and transparent source attribution.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${sourceSerif.variable} ${sourceSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.dataset.theme=localStorage.getItem('signal-theme')||'light';document.documentElement.dataset.readingSize=localStorage.getItem('signal-reading-size')||'standard'}catch{}`,
          }}
        />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <div className="site-frame">
          <Header />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
