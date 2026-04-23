import { randomUUID } from "crypto";

const sessions = new Map();

export const createSession = ({ browser, context, page, headless }) => {
  const sessionId = randomUUID();
  sessions.set(sessionId, {
    sessionId,
    browser,
    context,
    page,
    headless,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    // 同一 session 的调用串行化,避免 page 状态被并发写乱
    queue: Promise.resolve(),
  });
  return sessionId;
};

export const getSession = (sessionId) => {
  const sess = sessions.get(String(sessionId || ""));
  if (!sess) {
    throw new Error(`browser session not found: ${sessionId}`);
  }
  return sess;
};

export const listSessions = () =>
  [...sessions.values()].map((sess) => ({
    sessionId: sess.sessionId,
    headless: sess.headless,
    url: sess.page?.url?.() ?? "",
    createdAt: sess.createdAt,
    lastUsedAt: sess.lastUsedAt,
  }));

export const removeSession = (sessionId) => {
  sessions.delete(String(sessionId || ""));
};

export const enqueue = (sess, fn) => {
  const next = sess.queue.then(async () => {
    try {
      const result = await fn();
      sess.lastUsedAt = new Date().toISOString();
      return result;
    } catch (err) {
      sess.lastUsedAt = new Date().toISOString();
      throw err;
    }
  });
  // 队列本身不传播错误,保证后续调用能继续排队
  sess.queue = next.catch(() => {});
  return next;
};
