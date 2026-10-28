import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { build } from "esbuild";
const base = process.env.SIGNAL_REVIEW_URL || "http://127.0.0.1:3102";
const out = "artifacts/redesign-2";
const b = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
});
const c = await b.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
});
const p = await c.newPage();
const report = {
  responsive: [],
  accessibility: [],
  functional: [],
  errors: [],
  limitations: [
    "Chromium desktop emulation; no physical iOS/Android or screen-reader session.",
    "Full article is an isolated QA fixture: no licensed full articles exist in the database.",
  ],
};
p.on("pageerror", (e) => report.errors.push(e.message));
async function go(route) {
  const r = await p.goto(base + route, { waitUntil: "networkidle" });
  assert.ok(r?.ok(), `HTTP ${r?.status()} ${route}`);
  await p.evaluate(() => document.fonts.ready);
  if (route === "/__local_reading_fixture")
    await expect(p.locator(".full-article-body")).toBeVisible();
}
async function reflow(label) {
  const size = await p.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert.ok(
    size.scroll <= size.width + 1,
    `${label}: overflow ${JSON.stringify(size)}`,
  );
  report.responsive.push({ label, ...size });
}
async function axe(label) {
  const result = await new AxeBuilder({ page: p })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  report.accessibility.push({
    label,
    violations: result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  });
}
try {
  await fs.mkdir(out + "/after", { recursive: true });
  await go("/");
  const detail = await p.locator(".front-lead h1 a").getAttribute("href");
  const homeLinks = await p
    .locator(
      "main article h1 a,main article h2 a,main article h3 a,main article h4 a",
    )
    .evaluateAll((xs) => xs.map((x) => x.getAttribute("href")));
  assert.equal(homeLinks.length, new Set(homeLinks).size, "Repeated story");
  assert.equal(await p.locator(".daily-list article").count(), 6);
  await expect(
    p.getByRole("heading", { name: "The Daily Brief." }),
  ).toBeVisible();
  await expect(p.getByRole("heading", { name: "Go Deeper." })).toBeVisible();
  const html = await p.content();
  const htmlClass = await p.locator("html").getAttribute("class");
  const css = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)]
    .map((m) => m[0])
    .join("");
  await build({
    entryPoints: ["tests/fixtures/reading-layout.tsx"],
    outfile: out + "/reading-fixture.js",
    bundle: true,
    platform: "browser",
    format: "iife",
    define: { "process.env.NODE_ENV": '"production"' },
    minify: true,
    plugins: [
      {
        name: "next-image-interop",
        setup(build) {
          build.onResolve({ filter: /^next\/image$/ }, () => ({
            path: "image",
            namespace: "fixture-interop",
          }));
          build.onLoad({ filter: /.*/, namespace: "fixture-interop" }, () => ({
            contents:
              "export { Image as default } from 'next/dist/client/image-component.js'",
            resolveDir: process.cwd(),
          }));
        },
      },
    ],
  });
  const bundle = await fs.readFile(out + "/reading-fixture.js", "utf8");
  const fixture = `<!doctype html><html lang="en" class="${htmlClass}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Local reading fixture — not reporting</title><base href="${base}/">${css}</head><body><div id="fixture" class="site-frame"></div><script>var process={env:{}};</script><script src="/reading-fixture.js"></script></body></html>`;
  await fs.writeFile(
    out + "/reading-fixture.html",
    fixture.replace(
      '<script src="/reading-fixture.js"></script>',
      `<script>${bundle.replaceAll("</script", "<\\/script")}</script>`,
    ),
  );
  await p.route("**/__local_reading_fixture", (r) =>
    r.fulfill({ contentType: "text/html", body: fixture }),
  );
  await p.route("**/reading-fixture.js", (r) =>
    r.fulfill({ contentType: "application/javascript", body: bundle }),
  );
  // Actual source, excerpt, advisory and incident pages are all drawn from the existing collection.
  await go("/developers");
  const excerpt = await p
    .locator(".story-row h3 a")
    .first()
    .getAttribute("href");
  await go("/vulnerabilities");
  const advisory = await p
    .locator('main a[href^="/story/"]')
    .first()
    .getAttribute("href");
  await go("/outages");
  const incident = await p
    .locator('main a[href^="/story/"]')
    .first()
    .getAttribute("href");
  report.routes = { detail, excerpt, advisory, incident };
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    await p.setViewportSize({ width, height: 1000 });
    for (const [label, route] of [
      ["home", "/"],
      ["source", detail],
      ["excerpt", excerpt],
      ["advisory", advisory],
      ["reading-fixture", "/__local_reading_fixture"],
    ]) {
      await go(route);
      await reflow(`${label}-${width}`);
      if ([390, 1440].includes(width))
        await p.screenshot({
          path: `${out}/after/${label}-${width}.png`,
          fullPage: true,
        });
    }
  }
  for (const width of [390, 1440])
    for (const theme of ["light", "dark"]) {
      await p.setViewportSize({ width, height: 1000 });
      await p.evaluate((theme) => {
        localStorage.setItem("signal-theme", theme);
        document.documentElement.dataset.theme = theme;
      }, theme);
      for (const [label, route] of [
        ["home", "/"],
        ["source", detail],
        ["excerpt", excerpt],
        ["advisory", advisory],
        ["incident", incident],
        ["search", "/search"],
        ["saved", "/watchlist?tab=saved"],
        ["preferences", "/settings"],
        ["topics", "/developers"],
        ["sources", "/sources"],
      ]) {
        await go(route);
        await axe(`${label}-${theme}-${width}`);
      }
      if (theme === "dark") {
        await go("/");
        await p.screenshot({
          path: `${out}/after/home-dark-${width}.png`,
          fullPage: true,
        });
      }
    }
  await p.evaluate(() => localStorage.setItem("signal-theme", "light"));
  await p.setViewportSize({ width: 390, height: 900 });
  await go("/");
  const menu = p.getByRole("button", { name: "Sections" });
  await menu.focus();
  await p.keyboard.press("Enter");
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await p
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: "Latest", exact: true })
    .focus();
  await p.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  const more = p.locator(".topics-menu summary");
  await more.focus();
  await p.keyboard.press("Enter");
  await expect(p.locator(".topics-menu")).toHaveAttribute("open", "");
  await p.keyboard.press("Escape");
  await expect(more).toBeFocused();
  await menu.click();
  report.functional.push(
    "Keyboard menu: Enter/Escape, focus restoration, topic disclosure",
  );
  await p.keyboard.press("Control+Home");
  await p.locator(".skip-link").focus();
  await p.keyboard.press("Enter");
  assert.equal(await p.evaluate(() => document.activeElement?.id), "main");
  report.functional.push("Skip link reaches main");
  await go(detail);
  await expect(p.locator(".source-preview")).toHaveCount(1);
  assert.equal(await p.locator(".source-preview .story-visual").count(), 0);
  assert.equal(await p.locator(".source-disclosure[open]").count(), 0);
  const sourceLink = p.getByRole("link", {
    name: "Read the original reporting",
  });
  assert.match(await sourceLink.getAttribute("href"), /^https:\/\//);
  assert.equal(await sourceLink.getAttribute("target"), "_blank");
  await p.locator("main summary").filter({hasText:"Sources & methodology"}).click();
  await expect(
    p.getByRole("heading", { name: "How this story was selected" }),
  ).toBeVisible();
  await p.screenshot({
    path: out + "/after/source-expanded-390.png",
    fullPage: true,
  });
  report.functional.push(
    "Source-only classification, no pseudo-article art, original URL and source disclosure",
  );
  const save = p.getByRole("button", { name: "Bookmark story" });
  await save.click();
  await expect(
    p.getByRole("button", { name: "Remove bookmark" }),
  ).toHaveAttribute("aria-pressed", "true");
  await p.reload({ waitUntil: "networkidle" });
  await expect(
    p.getByRole("button", { name: "Remove bookmark" }),
  ).toHaveAttribute("aria-pressed", "true");
  await go("/watchlist?tab=saved");
  await expect(p.locator("#reading-panel article")).toHaveCount(1);
  report.functional.push(
    "Save persists across reload and appears in saved list",
  );
  await go(detail);
  await p.evaluate(() => Object.defineProperty(navigator, "share", {value: undefined, configurable: true}));
  await p.getByRole("button", { name: "Share story" }).click();
  await expect(p.getByRole("button", { name: "Link copied" })).toBeVisible();
  assert.equal(
    await p.evaluate(() => navigator.clipboard.readText()),
    base + detail,
  );
  report.functional.push("Share copies correct local story URL");
  await go("/watchlist");
  await p.getByRole("button", { name: "React", exact: true }).click();
  await p.reload({ waitUntil: "networkidle" });
  await expect(
    p.getByRole("button", { name: "React", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  report.functional.push("Technology follows persist");
  await go("/search");
  await p
    .getByRole("textbox", { name: "SEARCH", exact: true })
    .fill("datacenter");
  await p.getByRole("button", { name: "Apply filters" }).click();
  await p.waitForURL(/q=datacenter/);
  await expect(p.locator(".story-row").first()).toBeVisible();
  report.functional.push("Server search and query filters");
  await go("/search?q=NoMatchingStory_934871");
  await expect(
    p.getByRole("heading", { name: "No matching stories." }),
  ).toBeVisible();
  report.functional.push("Empty results");
  await go("/settings");
  await p.getByLabel("Text size", { exact: true }).selectOption("large");
  await p.reload({ waitUntil: "networkidle" });
  await expect(p.getByLabel("Text size", { exact: true })).toHaveValue("large");
  report.functional.push("Reading size persists");
  await p.getByRole("button", { name: "Switch to dark theme" }).click();
  await p.reload({ waitUntil: "networkidle" });
  await expect(p.locator("html")).toHaveAttribute("data-theme", "dark");
  await p.getByRole("button", { name: "Switch to light theme" }).click();
  report.functional.push("Theme persists");
  await go("/__local_reading_fixture");
  await p.getByRole("button", { name: "Focus mode", exact: true }).click();
  await expect(p.locator("header")).toBeHidden();
  await expect(
    p.getByRole("button", { name: "Exit focus mode" }),
  ).toBeVisible();
  await p.getByRole("button", { name: "Exit focus mode" }).click();
  await expect(p.locator("header")).toBeVisible();
  await p.getByText("Missing-image test", { exact: true }).click();
  await expect(p.getByText("Image unavailable", { exact: true })).toBeVisible();
  report.functional.push(
    "Full-body fixture: focus exit and missing-image fallback",
  );
  await p.getByLabel("Text size", { exact: true }).selectOption("standard");
  await axe("full-reading-fixture");
  for (const route of ["/", detail, "/__local_reading_fixture"]) {
    await p.setViewportSize({ width: 720, height: 1000 });
    await go(route);
    await reflow("200%-equivalent-reflow " + route);
    await p.addStyleTag({ content: "html{font-size:200% !important}" });
    await reflow("200%-text-enlargement " + route);
    await p.setViewportSize({ width: 390, height: 1000 });
    await go(route);
    await p.addStyleTag({
      content:
        "*{line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important}p{margin-bottom:2em !important}",
    });
    await reflow("custom-text-spacing " + route);
  }
  await p.setViewportSize({ width: 390, height: 900 });
  await go("/");
  await p
    .locator(".front-lead h1 a")
    .evaluate(
      (el) =>
        (el.textContent =
          "A deliberately long headline tests wrapping across very narrow screens with an extraordinarilylongunbrokentermthatmustneverescapethepage"),
    );
  await p
    .locator(".front-lead .publication-credit span")
    .first()
    .evaluate(
      (el) =>
        (el.textContent =
          "An exceptionally long original publisher and research institution name"),
    );
  await reflow("long-title-and-publisher");
  await p.emulateMedia({ reducedMotion: "reduce" });
  assert.ok(
    await p.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  );
  report.functional.push("Reduced-motion preference");
  for (const route of [
    "/latest",
    "/ai",
    "/security",
    "/developers",
    "/community",
    "/outages",
    "/vulnerabilities",
    "/briefing",
    "/search?category=technology",
    "/sources",
    "/watchlist",
    "/settings",
  ]) {
    await go(route);
    await reflow("route " + route);
  }
  report.functional.push("All specialist and utility routes reachable");
  await p.setViewportSize({ width: 1440, height: 1000 });
  await go("/");
  await p.screenshot({ path: out + "/after/home-first-screen.png" });
  await fs.writeFile(out + "/validation.json", JSON.stringify(report, null, 2));
  assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
  const violations = report.accessibility.filter((x) => x.violations.length);
  assert.equal(violations.length, 0, JSON.stringify(violations, null, 2));
  console.log(
    `BROWSER VERIFIED: ${report.responsive.length} reflow checks; ${report.accessibility.length} axe scans; ${report.functional.length} functional groups.`,
  );
} catch (e) {
  await fs.writeFile(out + "/validation.json", JSON.stringify(report, null, 2));
  throw e;
} finally {
  await b.close();
}
