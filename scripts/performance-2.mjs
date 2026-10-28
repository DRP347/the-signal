import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const b = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
});
const results = [];
try {
  for (const [label, url] of [
    ["before", "http://127.0.0.1:3100"],
    ["after", "http://127.0.0.1:3102"],
  ])
    for (let run = 1; run <= 3; run++) {
      const context = await b.newContext({
        viewport: { width: 390, height: 844 },
      });
      const p = await context.newPage();
      const cdp = await context.newCDPSession(p);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 150,
        downloadThroughput: 200000,
        uploadThroughput: 93750,
        connectionType: "cellular4g",
      });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await p.addInitScript(() => {
        window.__measure = { lcp: 0, shifts: [], events: [] };
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) window.__measure.lcp = e.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((l) => {
          for (const e of l.getEntries())
            if (!e.hadRecentInput)
              window.__measure.shifts.push({
                time: e.startTime,
                value: e.value,
              });
        }).observe({ type: "layout-shift", buffered: true });
        new PerformanceObserver((l) => {
          for (const e of l.getEntries())
            if (e.interactionId)
              window.__measure.events.push({
                name: e.name,
                duration: e.duration,
              });
        }).observe({ type: "event", buffered: true, durationThreshold: 16 });
      });
      await p.goto(url, { waitUntil: "networkidle" });
      await p.evaluate(() => document.fonts.ready);
      await p.getByRole("button", { name: "Switch to dark theme" }).click();
      await p.waitForTimeout(250);
      const m = await p.evaluate(() => {
        const resources = performance.getEntriesByType("resource");
        let max = 0,
          current = 0,
          start = 0,
          last = 0;
        for (const s of window.__measure.shifts) {
          if (s.time - last > 1000 || s.time - start > 5000) {
            current = 0;
            start = s.time;
          }
          current += s.value;
          max = Math.max(max, current);
          last = s.time;
        }
        return {
          ...window.__measure,
          cls: max,
          transferBytes: resources.reduce((sum, r) => sum + r.transferSize, 0),
          fonts: resources
            .filter((r) => r.name.includes(".woff2"))
            .map((r) => ({
              name: r.name.split("/").at(-1),
              bytes: r.transferSize,
            })),
          navigation: performance.getEntriesByType("navigation")[0].toJSON(),
        };
      });
      results.push({
        label,
        run,
        url,
        lcpMs: Math.round(m.lcp),
        cls: m.cls,
        observedInteractionMaxMs: Math.max(
          0,
          ...m.events.map((e) => e.duration),
        ),
        transferBytes: m.transferBytes,
        fonts: m.fonts,
        ttfbMs: Math.round(
          m.navigation.responseStart - m.navigation.requestStart,
        ),
      });
      await context.close();
    }
  await fs.writeFile(
    "artifacts/redesign-2/performance.json",
    JSON.stringify(
      {
        conditions:
          "Local production servers, cold browser cache, 390x844, 4x CPU slowdown, 150ms network latency, 1.6Mbps down. Three samples per version. Event timing is one scripted theme interaction, not field INP.",
        results,
      },
      null,
      2,
    ),
  );
  console.log(
    results.map((r) => ({
      label: r.label,
      run: r.run,
      lcpMs: r.lcpMs,
      cls: r.cls,
      observedInteractionMaxMs: r.observedInteractionMaxMs,
      transferBytes: r.transferBytes,
    })),
  );
} finally {
  await b.close();
}
