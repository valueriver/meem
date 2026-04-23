import { loadPlaywright } from "../core/runCode.js";
import { createSession } from "../core/sessions.js";

export const browserOpen = async ({ headless = true, url } = {}) => {
  const chromium = await loadPlaywright();
  const browser = await chromium.launch({ headless: !!headless });
  const context = await browser.newContext();
  const page = await context.newPage();

  if (url) {
    await page.goto(String(url), { waitUntil: "load" });
  }

  const sessionId = createSession({
    browser,
    context,
    page,
    headless: !!headless,
  });

  return { sessionId, headless: !!headless, url: page.url() };
};
