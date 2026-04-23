import { runUserCode } from "../core/runCode.js";
import { enqueue, getSession } from "../core/sessions.js";

export const browserExec = async ({
  sessionId,
  code,
  timeoutSeconds = 30,
  signal,
} = {}) => {
  const sess = getSession(sessionId);
  return enqueue(sess, async () => {
    const result = await runUserCode(
      code,
      { page: sess.page, browser: sess.browser, context: sess.context },
      {
        signal,
        timeoutMs: Math.max(1000, Number(timeoutSeconds) * 1000) || 30000,
      },
    );
    return { ok: true, url: sess.page.url(), result };
  });
};
