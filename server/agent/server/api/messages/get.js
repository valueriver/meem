import { listMessages } from "../../services/messages/index.js";

const handleMessagesGet = async (_req, res, { sendJson }, url) => {
  const conversationId = url.searchParams.get("conversationId");
  if (!conversationId) {
    sendJson(res, 400, { ok: false, error: "conversationId is required" });
    return;
  }
  const page = Number.parseInt(url.searchParams.get("page"), 10) || 1;
  const limit = Number.parseInt(url.searchParams.get("limit"), 10) || 50;
  const order = url.searchParams.get("order") || "asc";
  const result = listMessages(conversationId, page, limit, order);
  sendJson(res, 200, { ok: true, ...result });
};

export { handleMessagesGet };
