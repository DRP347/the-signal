"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <h1>Intelligence temporarily unavailable.</h1>
      <p>
        We could not load the stored records. This does not indicate a
        technology incident or service outage.
      </p>
      <button className="outline-button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
