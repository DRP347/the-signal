"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Bookmark } from "lucide-react";
import { useRef, useState } from "react";
const links = [
  ["/", "Front page"],
  ["/latest", "Latest"],
  ["/ai", "AI & ideas"],
  ["/search?category=technology", "Technology"],
  ["/community", "Culture & community"],
];
const more = [
  ["/security", "Security"],
  ["/developers", "Developers"],
  ["/outages", "Service status"],
  ["/vulnerabilities", "Security advisories"],
  ["/watchlist", "Your reading list"],
  ["/settings", "Reading preferences"],
  ["/sources", "Sources & methodology"],
];
export function Navigation() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const disclosure = useRef<HTMLDetailsElement>(null);
  const close = () => {
    setOpen(false);
    if (disclosure.current) disclosure.current.open = false;
  };
  return (
    <div
      className="navigation-wrap"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          if (disclosure.current?.open) {
            disclosure.current.open = false;
            disclosure.current.querySelector("summary")?.focus();
          } else {
            setOpen(false);
            toggle.current?.focus();
          }
        }
      }}
    >
      <div className="mobile-nav-bar">
        <Link href="/briefing">The daily edition ↗</Link>
        <Link
          className="icon-button"
          href="/watchlist?tab=saved"
          aria-label="Saved stories"
        >
          <Bookmark size={18} />
        </Link>
        <button
          ref={toggle}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="primary-navigation"
        >
          {open ? <X size={19} /> : <Menu size={19} />} Sections
        </button>
      </div>
      <nav
        id="primary-navigation"
        className={`main-nav ${open ? "is-open" : ""}`}
        aria-label="Primary navigation"
      >
        {links.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            aria-current={path === href ? "page" : undefined}
            onClick={close}
          >
            {label}
          </Link>
        ))}
        <details className="topics-menu" ref={disclosure}>
          <summary>More / Topics</summary>
          <div>
            {more.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                aria-current={path === href ? "page" : undefined}
                onClick={close}
              >
                {label}
              </Link>
            ))}
          </div>
        </details>
        <Link href="/sources" className="nav-sources" onClick={close}>
          Our sources ↗
        </Link>
      </nav>
    </div>
  );
}
