const createAbortError = () => {
  if (typeof DOMException === "function") {
    return new DOMException("Aborted", "AbortError");
  }
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
};

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

// 将模型传进来的 code body 包装成 async function。
// ctx = { page, browser, context }
export const runUserCode = async (code, ctx, { signal, timeoutMs = 30000 } = {}) => {
  if (typeof code !== "string" || !code.trim()) {
    throw new Error("code is required");
  }

  const fn = new AsyncFunction(
    "ctx",
    `const {page, browser, context} = ctx;\n${code}`,
  );

  const promises = [fn(ctx)];

  if (signal) {
    if (signal.aborted) throw createAbortError();
    promises.push(
      new Promise((_, reject) => {
        signal.addEventListener(
          "abort",
          () => reject(createAbortError()),
          { once: true },
        );
      }),
    );
  }

  if (timeoutMs > 0) {
    promises.push(
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`browser script timeout after ${timeoutMs}ms`)),
          timeoutMs,
        ),
      ),
    );
  }

  return Promise.race(promises);
};

export const loadPlaywright = async () => {
  try {
    const mod = await import("playwright");
    return mod.chromium;
  } catch {
    throw new Error(
      "playwright 未安装或 chromium 二进制缺失。运行:  npx playwright install chromium",
    );
  }
};
