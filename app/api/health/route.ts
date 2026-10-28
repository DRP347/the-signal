import { sqlClient } from "@/lib/db";
export async function GET() {
  try {
    await sqlClient()`select 1`;
    return Response.json({
      database: "available",
      mode: "scheduled collection",
    });
  } catch {
    return Response.json({ database: "unavailable" }, { status: 503 });
  }
}
