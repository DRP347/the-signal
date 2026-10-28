"use client";
import Image from "next/image";
import { useState } from "react";
import type { EditorialVisual } from "@/lib/visuals";
export function VerifiedImage({
  visual,
  priority = false,
}: {
  visual: EditorialVisual;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="story-visual verified-visual">
      {failed ? (
        <div className="missing-image">
          <span>Image unavailable</span>
          <p>{visual.caption}</p>
          <a href={visual.sourceUrl} target="_blank" rel="noopener noreferrer">
            View the credited source ↗
          </a>
        </div>
      ) : (
        <Image
          src={visual.src}
          alt={visual.alt}
          width={visual.width}
          height={visual.height}
          sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1100px) 65vw, 850px"
          preload={priority}
          loading={priority ? undefined : "lazy"}
          style={{
            objectPosition: `${visual.focalPoint.x * 100}% ${visual.focalPoint.y * 100}%`,
          }}
          onError={() => setFailed(true)}
        />
      )}
      <figcaption>
        {visual.caption}{" "}
        <a href={visual.sourceUrl} target="_blank" rel="noopener noreferrer">
          {visual.credit}
        </a>{" "}
        · {visual.license}
      </figcaption>
    </figure>
  );
}
