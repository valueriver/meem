import { loadPlaywright, runUserCode } from "../core/runCode.js";

export const browserScript = async ({
  code,
  headless = true,
  timeoutSeconds = 30,
  signal,
} = {}) => {
  const chromium = await loadPlaywright();
  const browser = await chromium.launch({ headless: !!headless });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const result = await runUserCode(
      code,
      { page, browser, context },
      {
        signal,
        timeoutMs: Math.max(1000, Number(timeoutSeconds) * 1000) || 30000,
      },
    );
    return { ok: true, result };
  } finally {
    await browser.close().catch(() => {});
  }
};
