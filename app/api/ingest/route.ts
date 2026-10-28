import { revalidateTag } from "next/cache";
import { authenticated, ingest } from "@/lib/ingestion/pipeline";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: Request) {
  if (!authenticated(request.headers.get("authorization")))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await ingest();
    revalidateTag("intelligence", "max");
    return Response.json(result);
  } catch {
    return Response.json(
      { error: "Ingestion infrastructure unavailable" },
      { status: 503 },
    );
  }
}
