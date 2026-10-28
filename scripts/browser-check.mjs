import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
});
const page = await browser.newPage();
const originalGoto = page.goto.bind(page);
page.goto = (url, options = {}) =>
  originalGoto(url, { waitUntil: "networkidle", ...options });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto("http://127.0.0.1:3100", { waitUntil: "networkidle" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "artifacts/home-desktop.png", fullPage: true });
  const routes = [
    "/",
    "/briefing",
    "/latest",
    "/security",
    "/outages",
    "/developers",
    "/ai",
    "/community",
    "/vulnerabilities",
    "/watchlist",
    "/search",
    "/sources",
    "/settings",
  ];
  const checks = [];
  for (const width of [375, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const response = await page.goto("http://127.0.0.1:3100" + route, {
        waitUntil: "networkidle",
      });
      assert.equal(response.status(), 200, route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      assert.equal(overflow, false, `${route} overflow at ${width}`);
      assert.equal(await page.locator("h1").count(), 1);
      assert.equal(
        await page.getByText("Intelligence temporarily unavailable.").count(),
        0,
      );
      assert.equal(
        await page
          .getByText(/The intelligence database is unavailable/)
          .count(),
        0,
      );
      checks.push({ route, width, status: 200, overflow });
    }
    await page.goto("http://127.0.0.1:3100");
    await page.screenshot({
      path: `artifacts/home-${width}.png`,
      fullPage: true,
    });
  }
  for (const width of [375, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("http://127.0.0.1:3100", { waitUntil: "networkidle" });
    await page.screenshot({ path: `artifacts/front-viewport-${width}.png` });
    const story = await page.locator(".front-lead h1 a").getAttribute("href");
    await page.goto("http://127.0.0.1:3100" + story, {
      waitUntil: "networkidle",
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `story overflow ${width}`,
    );
    await page.screenshot({
      path: `artifacts/article-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://127.0.0.1:3100");
  const detail = await page.locator(".front-lead h1 a").getAttribute("href");
  assert.ok(detail);
  await page.goto("http://127.0.0.1:3100" + detail);
  assert.ok(
    await page
      .getByRole("link", { name: "Read the original source", exact: false })
      .count(),
  );
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("button", { name: "Bookmark story", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Remove bookmark", exact: true }),
  ).toBeVisible();
  await page.goto("http://127.0.0.1:3100/watchlist", {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: "React", exact: true }).click();
  await page.reload({ waitUntil: "networkidle" });
  await expect(
    page.getByRole("button", { name: "React", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("tab", { name: /Saved stories/ }).click();
  await expect(page.locator(".story-row").first()).toBeVisible();
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(250);
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.screenshot({
    path: "artifacts/watchlist-dark.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.goto("http://127.0.0.1:3100/search");
  await page
    .getByRole("textbox", { name: "SEARCH", exact: true })
    .fill("zzznomatch987");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await page.waitForURL(/q=zzznomatch/);
  await page.getByRole("heading", { name: "No matching stories." }).waitFor();
  await page.goto("http://127.0.0.1:3100/outages");
  await page.screenshot({
    path: "artifacts/outages-desktop.png",
    fullPage: true,
  });
  await page.goto("http://127.0.0.1:3100/vulnerabilities");
  await page.locator("tbody tr a").first().click();
  await page
    .getByRole("heading", { name: "Official advisory details" })
    .waitFor();
  await page.screenshot({
    path: "artifacts/advisory-desktop.png",
    fullPage: true,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("http://127.0.0.1:3100");
  assert.equal(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    true,
  );
  const unauthorized = await page.request.post(
    "http://127.0.0.1:3100/api/ingest",
  );
  assert.equal(unauthorized.status(), 401);
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "artifacts/browser-report.json",
    JSON.stringify(
      {
        checks,
        interactions: [
          "watchlist persistence",
          "bookmark persistence",
          "theme persistence",
          "empty search",
          "source attribution",
          "advisory details",
          "reduced motion",
          "ingestion auth",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "BROWSER VERIFICATION PASSED",
    checks.length,
    "route/viewport checks",
  );
} finally {
  await browser.close();
}
