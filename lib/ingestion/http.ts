const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export class HttpError extends Error {
  constructor(
    public status: number,
    public retryAfterMs = 0,
  ) {
    super(`Upstream HTTP ${status}`);
  }
}
export function retryDelay(value: string | null, now = Date.now()) {
  if (!value) return 0;
  const seconds = Number(value);
  return Number.isFinite(seconds)
    ? Math.max(0, seconds * 1000)
    : Math.max(0, Date.parse(value) - now) || 0;
}
export async function request(
  url: string,
  init: RequestInit = {},
  attempts = 3,
): Promise<Response> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(15000),
        headers: {
          "User-Agent":
            process.env.INGEST_USER_AGENT ??
            "TheSignal/0.1 (technology briefing)",
          Accept:
            "application/json, application/rss+xml, application/atom+xml, text/xml;q=0.9",
          ...init.headers,
        },
      });
      if (response.ok || response.status === 304) return response;
      const delay = Math.max(
        retryDelay(response.headers.get("retry-after")),
        response.headers.get("x-ratelimit-remaining") === "0"
          ? Math.max(
              0,
              Number(response.headers.get("x-ratelimit-reset")) * 1000 -
                Date.now(),
            )
          : 0,
      );
      await response.body?.cancel();
      const error = new HttpError(response.status, delay);
      if (response.status === 429 || response.status >= 500) throw error;
      throw error;
    } catch (error) {
      if (
        error instanceof HttpError &&
        ((error.status < 500 && error.status !== 429) ||
          error.retryAfterMs > 30000)
      )
        throw error;
      if (attempt === attempts - 1) throw error;
      await sleep(
        Math.max(
          error instanceof HttpError ? error.retryAfterMs : 0,
          500 * 2 ** attempt,
        ) + Math.floor(Math.random() * 200),
      );
    }
  }
  throw new Error("Request failed");
}
export async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await request(url, init);
  const body = await r.text();
  if (body.length > 15_000_000)
    throw new Error("Source response exceeds size limit");
  return JSON.parse(body) as T;
}
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const result: R[] = [];
  let position = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (position < items.length) {
        const i = position++;
        result[i] = await fn(items[i]);
      }
    }),
  );
  return result;
}
