import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>This page is off the radar.</h1>
      <p>The record may have expired or this address does not exist.</p>
      <Link href="/">Return to the briefing</Link>
    </div>
  );
}
