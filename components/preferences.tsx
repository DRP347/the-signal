"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Moon, Sun, Bookmark, Check, Plus, X } from "lucide-react";
import { ReadingSize } from "./reading-tools";
import { technologyNames } from "@/lib/types";
const subscribe = (fn: () => void) => {
  window.addEventListener("storage", fn);
  window.addEventListener("signal-preferences", fn);
  return () => {
    window.removeEventListener("storage", fn);
    window.removeEventListener("signal-preferences", fn);
  };
};
function read(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
export function savePreference(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    window.dispatchEvent(new Event("signal-preferences"));
    return true;
  } catch {
    return false;
  }
}
export function useStored(key: string, fallback: string) {
  return useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback,
  );
}
export function parseList(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((x) => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}
export function ThemeButton() {
  const theme = useStored("signal-theme", "light");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return (
    <button
      className="icon-button"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      onClick={() =>
        savePreference("signal-theme", theme === "light" ? "dark" : "light")
      }
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
export function BookmarkButton({
  id,
  showLabel = false,
}: {
  id: string;
  showLabel?: boolean;
}) {
  const values = parseList(useStored("signal-bookmarks", "[]"));
  const active = values.includes(id);
  const [error, setError] = useState(false);
  return (
    <>
      <button
        className={showLabel ? "outline-button" : "icon-button"}
        aria-label={active ? "Remove bookmark" : "Bookmark story"}
        aria-pressed={active}
        onClick={() =>
          setError(
            !savePreference(
              "signal-bookmarks",
              JSON.stringify(
                active ? values.filter((v) => v !== id) : [...values, id],
              ),
            ),
          )
        }
      >
        <Bookmark size={17} fill={active ? "currentColor" : "none"} />
        {showLabel && (active ? "Saved" : "Save story")}
      </button>
      {error && <small role="alert">Browser storage is unavailable.</small>}
    </>
  );
}
export function WatchControls() {
  const watched = parseList(useStored("signal-watchlist", "[]"));
  const [error, setError] = useState(false);
  return (
    <div>
      <div className="technology-picker">
        {technologyNames.map((t) => (
          <button
            key={t}
            className={
              watched.includes(t) ? "technology selected" : "technology"
            }
            aria-pressed={watched.includes(t)}
            onClick={() =>
              setError(
                !savePreference(
                  "signal-watchlist",
                  JSON.stringify(
                    watched.includes(t)
                      ? watched.filter((v) => v !== t)
                      : [...watched, t],
                  ),
                ),
              )
            }
          >
            {watched.includes(t) ? <Check size={14} /> : <Plus size={14} />} {t}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert">
          Preferences could not be saved. Check browser storage permissions.
        </p>
      )}
    </div>
  );
}
export function Settings() {
  const [cleared, setCleared] = useState(false);
  return (
    <div className="settings-list">
      <section>
        <h2>Make it yours.</h2>
        <p>
          Follow technologies to build a focused reading list. Preferences and
          bookmarks stay in this browser. No account or tracking required.
        </p>
        <WatchControls />
      </section>
      <section>
        <h2>Appearance</h2>
        <p>Switch between our light and dark reading environments.</p>
        <ThemeButton />
        <ReadingSize />
      </section>
      <section>
        <h2>Your browser data</h2>
        <p>Clear watched technologies and saved stories on this device.</p>
        <button
          className="outline-button"
          onClick={() => {
            savePreference("signal-watchlist", "[]");
            savePreference("signal-bookmarks", "[]");
            setCleared(true);
          }}
        >
          <X size={15} /> Clear preferences
        </button>
        {cleared && <p role="status">Local preferences cleared.</p>}
      </section>
    </div>
  );
}
