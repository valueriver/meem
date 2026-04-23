import { getSession, removeSession } from "../core/sessions.js";

export const browserClose = async ({ sessionId } = {}) => {
  const sess = getSession(sessionId);
  await sess.browser.close().catch(() => {});
  removeSession(sessionId);
  return { ok: true, sessionId };
};
