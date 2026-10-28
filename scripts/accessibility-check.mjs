import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
});
const context = await browser.newContext();
const page = await context.newPage();
const report = [];
try {
  for (const route of [
    "/",
    "/watchlist",
    "/search",
    "/outages",
    "/vulnerabilities",
    "/sources",
    "/settings",
  ]) {
    await page.goto("http://127.0.0.1:3100" + route, {
      waitUntil: "networkidle",
    });
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    report.push({
      route,
      violations: result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    });
  }
} finally {
  await browser.close();
}
await fs.writeFile(
  "artifacts/accessibility-report.json",
  JSON.stringify(report, null, 2),
);
const failures = report.flatMap((r) => r.violations);
console.log(
  JSON.stringify(
    report.filter((r) => r.violations.length),
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
else console.log("ACCESSIBILITY CHECK PASSED");
