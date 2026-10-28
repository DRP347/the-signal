"use client";
import { Share2, Check } from "lucide-react";
import { useState } from "react";
export function ShareButton({ title }: { title: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setState("copied");
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setState("error");
    }
  }
  return (
    <span className="share-control">
      <button className="outline-button" onClick={share}>
        {state === "copied" ? <Check size={17} /> : <Share2 size={17} />}{" "}
        {state === "copied" ? "Link copied" : "Share story"}
      </button>
      <span role="status">
        {state === "error"
          ? "Could not share. Copy this page’s address from your browser."
          : ""}
      </span>
    </span>
  );
}
