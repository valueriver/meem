import { listMemos } from "../../services/memos/index.js";

const handleMemosGet = async (_req, res, { sendJson }, url) => {
  const conversationId = url.searchParams.get("conversationId") || undefined;
  const memos = listMemos(conversationId);
  sendJson(res, 200, { ok: true, memos });
};

export { handleMemosGet };
