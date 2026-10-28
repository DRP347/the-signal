"use client";
import { useEffect, useState } from "react";
import { useStored, savePreference } from "./preferences";
export function ReadingSize() {
  const size = useStored("signal-reading-size", "standard");
  const [error, setError] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.readingSize = size;
  }, [size]);
  return (
    <div className="reading-size">
      <label htmlFor="reading-size">Text size</label>
      <select
        id="reading-size"
        value={size}
        onChange={(e) =>
          setError(!savePreference("signal-reading-size", e.target.value))
        }
      >
        <option value="standard">Standard</option>
        <option value="large">Larger</option>
      </select>
      {error && <span role="alert">Browser storage is unavailable.</span>}
    </div>
  );
}
export function ReadingTools() {
  const [focus, setFocus] = useState(false);
  return (
    <div className="reading-tools" data-focus={focus}>
      <ReadingSize />
      <button
        className="outline-button"
        aria-pressed={focus}
        onClick={() => setFocus(!focus)}
      >
        {focus ? "Exit focus mode" : "Focus mode"}
      </button>
    </div>
  );
}
