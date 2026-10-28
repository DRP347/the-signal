import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
});
const context = await browser.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
const base = "http://127.0.0.1:3100";
const checks = [],
  accessibility = [];
try {
  await page.goto(base, { waitUntil: "networkidle" });
  const detail = await page.locator(".front-lead h1 a").getAttribute("href");
  const mainTitles = await page
    .locator("main article h1 a,main article h2 a,main article h3 a")
    .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
  assert.equal(
    mainTitles.length,
    new Set(mainTitles).size,
    "Repeated homepage story",
  );
  assert.ok(
    await page.evaluate(() =>
      document.fonts.check(
        '20px "' +
          getComputedStyle(document.querySelector("h1"))
            .fontFamily.split(",")[0]
            .replaceAll('"', "") +
          '"',
      ),
    ),
  );
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const mode of ["light", "dark"]) {
      await page.evaluate((theme) => {
        localStorage.setItem("signal-theme", theme);
        document.documentElement.dataset.theme = theme;
      }, mode);
      for (const route of [
        "/",
        detail,
        "/watchlist",
        "/search",
        "/outages",
        "/vulnerabilities",
        "/sources",
        "/settings",
      ]) {
        await page.goto(base + route, { waitUntil: "networkidle" });
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        accessibility.push({
          width,
          mode,
          route,
          violations: result.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          })),
        });
      }
      await page.goto(base, { waitUntil: "networkidle" });
      await page.screenshot({
        path: `artifacts/editorial-${mode}-${width}.png`,
        fullPage: true,
      });
    }
  }
  await page.evaluate(() => {
    localStorage.setItem("signal-theme", "light");
  });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(base, { waitUntil: "networkidle" });
  const menu = page.getByRole("button", { name: "Sections" });
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: "Latest", exact: true })
    .focus();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Enter");
  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: "Latest", exact: true })
    .click();
  await expect(page).toHaveURL(/latest$/);
  checks.push(
    "Mobile section menu keyboard open, Escape focus return, navigation",
  );
  await page.goto(base + detail, { waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: "Bookmark story", exact: true })
    .click();
  await page.getByRole("link", { name: "Saved stories", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: /Saved stories/ }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".story-row")).toHaveCount(1);
  await page.getByRole("tab", { name: /Saved stories/ }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("tab", { name: /Following/ })).toBeFocused();
  checks.push("Saved shortcut, bookmark rendering and keyboard tabs");
  await page.goto(base + detail, { waitUntil: "networkidle" });
  await page.evaluate(() =>
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    }),
  );
  await page.getByRole("button", { name: "Share story" }).click();
  await expect(page.getByRole("button", { name: "Link copied" })).toBeVisible();
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    base + detail,
  );
  checks.push("Share copies exact article URL");
  const json = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  assert.equal(JSON.parse(json)["@type"], "WebPage");
  assert.ok(JSON.parse(json).isBasedOn.length);
  checks.push("Source-linked structured data");
  await page.goto(base + "/search?q=React", { waitUntil: "networkidle" });
  assert.ok(await page.locator(".story-row").count());
  checks.push("Search returns matching real records");
  await page.goto(base, { waitUntil: "networkidle" });
  await page.keyboard.press("Control+Home");
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press("Tab");
  // Explicit focus tests keyboard-visible skip link without assuming browser navigation's initial focus.
  await page.locator(".skip-link").focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => location.hash), "#main");
  checks.push("Skip link reaches main content");
  await fs.writeFile(
    "artifacts/editorial-interactions.json",
    JSON.stringify({ checks, accessibility }, null, 2),
  );
  assert.equal(
    accessibility.flatMap((r) => r.violations).length,
    0,
    "Accessibility violations; see report",
  );
  console.log(
    "EDITORIAL CHECK PASSED",
    checks.length,
    "interaction groups;",
    accessibility.length,
    "accessibility scans",
  );
} finally {
  await browser.close();
}
