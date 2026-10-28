import { NextRequest, NextResponse } from "next/server";
import { storyList } from "@/lib/queries";
import { technologyNames } from "@/lib/types";
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const page = Math.max(
    1,
    Math.min(1000, Math.floor(Number(p.get("page")) || 1)),
  );
  let result;
  if (p.has("bookmarks"))
    result = await storyList({
      ids: (p.get("bookmarks") ?? "").split(",").slice(0, 100),
      page,
      order: "latest",
    });
  else if (p.has("technologies"))
    result = await storyList({
      technologies: (p.get("technologies") ?? "")
        .split(",")
        .filter((t) =>
          technologyNames.includes(t as (typeof technologyNames)[number]),
        )
        .slice(0, 12),
      page,
      order: "latest",
    });
  else result = await storyList({ query: p.get("q") ?? undefined, page });
  return NextResponse.json(result, {
    status: result.error ? 503 : 200,
    headers: { "Cache-Control": "private, no-store" },
  });
}
