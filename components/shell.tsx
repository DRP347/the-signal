import Link from "next/link";
import { Bookmark, Search, SlidersHorizontal } from "lucide-react";
import { ThemeButton } from "./preferences";
import { Navigation } from "./navigation";
export function Header() {
  return (
    <>
      <header className="masthead">
        <div className="edition-line">
          <span>An independent technology newspaper</span>
          <time>
            {new Intl.DateTimeFormat("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "Asia/Kolkata",
            }).format(new Date())}
          </time>
        </div>
        <div className="masthead-main">
          <div className="masthead-note">
            <span>Technology. People.</span>
            <em>The world between.</em>
          </div>
          <Link href="/" className="wordmark" aria-label="The Signal home">
            the signal<span>.</span>
            <svg viewBox="0 0 36 36" aria-hidden="true">
              <path d="M18 1v34M1 18h34M6 6l24 24M6 30 24-24" />
            </svg>
          </Link>
          <div className="header-actions">
            <Link className="icon-button" href="/search" aria-label="Search">
              <Search size={21} />
            </Link>
            <Link
              className="icon-button"
              href="/watchlist?tab=saved"
              aria-label="Saved stories"
            >
              <Bookmark size={20} />
            </Link>
            <ThemeButton />
            <Link
              className="icon-button settings-link"
              href="/settings"
              aria-label="Settings"
            >
              <SlidersHorizontal size={19} />
            </Link>
          </div>
        </div>
      </header>
      <Navigation />
    </>
  );
}
export function Footer() {
  return (
    <footer>
      <div className="footer-identity">
        <Link href="/" className="footer-brand">
          the signal.
        </Link>
        <p>A clearer view of a world in motion.</p>
      </div>
      <nav aria-label="Footer">
        <Link href="/briefing">The daily briefing</Link>
        <Link href="/sources">Sources & methodology</Link>
        <Link href="/vulnerabilities">Vulnerability intelligence</Link>
        <Link href="/watchlist">Your Signal</Link>
        <Link href="/settings">Reading preferences</Link>
      </nav>
      <div className="footer-note">
        <span>Read widely. Think independently.</span>
        <p>
          Automated collection, attributed reporting.
          <br />
          No ads. No invented bylines.
        </p>
        <small>Original reporting belongs to its publishers.</small>
      </div>
    </footer>
  );
}
