const { test, expect } = require("@playwright/test");
const fs = require("node:fs/promises");
const path = require("node:path");

test("loads every local resource without console errors or layout overflow", async ({ page, request }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Scaling Reasoning Efficiently via Relaxed On-Policy Distillation",
  );
  await expect(page.getByRole("link", { name: "OpenReview", exact: true })).toHaveAttribute(
    "href", "https://openreview.net/forum?id=l0h1SzRI7H#discussion",
  );
  await expect(page.locator(".venue")).toHaveCount(0);
  await expect(page.locator(".nav-paper")).toHaveAttribute(
    "href", "https://arxiv.org/abs/2603.11137",
  );
  const resources = await page.locator("a[href], img[src], link[href], script[src]").evaluateAll((elements) =>
    [...new Set(elements.map((element) => element.getAttribute("href") || element.getAttribute("src")))]
      .filter((url) => !url.startsWith("http") && !url.startsWith("#")),
  );
  for (const resource of resources) {
    const response = await request.get(`/${resource.split("#")[0]}`);
    expect(response.ok(), resource).toBeTruthy();
  }
  for (const image of await page.locator("img[src]").all()) {
    if (await image.getAttribute("id") === "enlarged-figure") continue;
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBeTruthy();
  }
  const anchors = await page.locator('a[href^="#"]').evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("href").slice(1)),
  );
  for (const id of anchors) expect(await page.locator(`[id="${id}"]`).count(), id).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  expect(errors).toEqual([]);
});

test("the demo rejects negative outliers early and clips selected outliers later", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#selection-summary")).toHaveText("6 / 8 selected · 0 clipped");
  await expect(page.locator(".token.not-selected")).toHaveCount(2);
  await page.getByRole("button", { name: "Refinement", exact: true }).click();
  await expect(page.locator("#selection-summary")).toHaveText("4 / 8 selected · 2 clipped");
  await expect(page.locator(".token.used-clipped")).toHaveCount(2);
  await expect(page.locator(".token.used-clipped .token-result").first()).toHaveText("Clipped: -2.56");
  await page.getByRole("button", { name: "Exploration", exact: true }).click();
  await expect(page.locator("#selection-summary")).toHaveText("6 / 8 selected · 0 clipped");
});

test("results tabs expose the right tables and support keyboard navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#panel-math")).toBeVisible();
  await expect(page.locator("#panel-visual")).toBeHidden();
  await page.getByRole("tab", { name: "Visual reasoning" }).click();
  await expect(page.locator("#panel-visual")).toBeVisible();
  await expect(page.locator("#panel-visual .ours")).toHaveCount(2);
  await expect(page.locator("#panel-math")).toBeHidden();
  await page.getByRole("tab", { name: "Visual reasoning" }).press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Visual tool use" })).toBeFocused();
  await expect(page.locator("#panel-tools")).toBeVisible();
  await expect(page.locator("#panel-tools .ours")).toContainText("65.75");
  await page.getByRole("tab", { name: "Visual tool use" }).press("Home");
  await expect(page.locator("#panel-math")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Math reasoning" })).toBeFocused();
});

test("figures enlarge, dismiss, and return focus", async ({ page }) => {
  await page.goto("/");
  const figure = page.locator("[data-zoom]").first();
  await figure.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("#enlarged-figure")).toHaveAttribute("src", /sample-efficiency\.webp$/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(figure).toBeFocused();
  await figure.click();
  await page.getByRole("button", { name: "Close enlarged figure" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("body")).not.toHaveClass(/dialog-open/);
});

test("citation matches the download and can be copied", async ({ page, context, request }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  const response = await request.get("/assets/citation.bib");
  const citation = await response.text();
  expect((await page.locator("#bibtex").textContent()).trim()).toBe(citation.trim());
  await page.getByRole("button", { name: "Copy BibTeX" }).click();
  await expect(page.locator("#copy-status")).toHaveText("BibTeX copied to clipboard.");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(citation);
});

test("clipboard denial gives an explicit recovery message", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => {
      throw new DOMException("Denied by test", "NotAllowedError");
    };
  });
  await page.getByRole("button", { name: "Copy BibTeX" }).click();
  await expect(page.locator("#copy-status")).toContainText("Clipboard permission was denied");
});

test("all results and figures remain available without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto("/");
  for (const panel of ["math", "visual", "tools"]) {
    await expect(page.locator(`#panel-${panel}`)).toBeVisible();
  }
  await expect(page.locator(".result-tabs")).toBeHidden();
  await expect(page.locator(".phase-controls")).toBeHidden();
  await expect(page.locator(".noscript-note")).toBeVisible();
  await expect(page.locator("[data-zoom]").first()).toHaveAttribute("href", "assets/figures/sample-efficiency.webp");
  await context.close();
});

test("page fits narrow and tablet viewports", async ({ page }) => {
  for (const width of [320, 375, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `width ${width}`).toBeTruthy();
    await page.getByRole("tab", { name: "Visual reasoning" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `visual table at ${width}`).toBeTruthy();
  }
});

test("renders share image and desktop/mobile previews", async ({ page }, testInfo) => {
  await fs.mkdir(path.resolve("preview"), { recursive: true });
  if (testInfo.project.name === "desktop") {
    await page.setViewportSize({ width: 1200, height: 630 });
    await page.goto("/assets/social-card.svg");
    await page.screenshot({ path: "assets/social-card.png" });
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page.goto("/");
  await page.evaluate(async () => {
    for (const image of document.querySelectorAll("img[loading='lazy']")) image.loading = "eager";
    await Promise.all([...document.querySelectorAll("img[src]")].map((image) => image.decode()));
    await document.fonts.ready;
  });
  await page.screenshot({ path: `preview/${testInfo.project.name}.png`, fullPage: true });
  await page.screenshot({ path: `preview/${testInfo.project.name}-hero.png` });
  await page.getByRole("button", { name: "Refinement", exact: true }).click();
  await page.locator("#allocation-demo").screenshot({ path: `preview/${testInfo.project.name}-method.png` });
});
