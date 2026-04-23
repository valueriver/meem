import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";
import { requestAgentJson } from "../clients/agent.js";

const mapAgentConversation = (item) => ({
  conversation_id: item.id || item.conversation_id,
  title: item.title || "",
  summary: item.summary || "",
  created_at: item.createdAt || item.created_at || "",
  message_count: item.messageCount || 0,
  preview: item.preview || ""
});

const handleChatApi = async (req, res, path, url) => {
  if (path === "/api/chat/list" && req.method === "GET") {
    const data = await requestAgentJson(`/api/chats?limit=200`);
    return json(res, (data.conversations || []).map(mapAgentConversation));
  }
  if (path === "/api/chat/create" && req.method === "POST") {
    const body = await readBody(req);
    const data = await requestAgentJson("/api/chats", {
      method: "POST",
      body: { title: body.title || "新对话" }
    });
    return json(res, { conversationId: data.conversation?.id });
  }
  if (path === "/api/chat/messages" && req.method === "GET") {
    const conversationId = url.searchParams.get("conversationId");
    if (!conversationId) return json(res, { error: "Missing conversationId" }, 400);
    const limit = Number(url.searchParams.get("limit") || 20);
    const offset = Number(url.searchParams.get("offset") || 0);
    const page = Math.floor(offset / Math.max(1, limit)) + 1;
    const data = await requestAgentJson(
      `/api/messages?conversationId=${encodeURIComponent(conversationId)}&page=${page}&limit=${limit}&order=desc`
    );
    const messages = (data.messages || []).reverse();
    return json(res, {
      messages,
      total: data.total || 0,
      hasMore: offset + limit < (data.total || 0),
      offset
    });
  }
  if (path === "/api/chat/rename" && req.method === "POST") {
    const body = await readBody(req);
    if (!body.conversationId) return json(res, { error: "Missing conversationId" }, 400);
    if (!body.title) return json(res, { error: "Missing title" }, 400);
    return json(res, await requestAgentJson(`/api/chats?id=${encodeURIComponent(body.conversationId)}`, {
      method: "PATCH",
      body: { title: body.title }
    }));
  }
  if (path === "/api/chat/delete" && req.method === "POST") {
    const body = await readBody(req);
    if (!body.conversationId) return json(res, { error: "Missing conversationId" }, 400);
    return json(res, await requestAgentJson(`/api/chats?id=${encodeURIComponent(body.conversationId)}`, {
      method: "DELETE"
    }));
  }
  return json(res, { error: "API endpoint not found" }, 404);
};
export {
  handleChatApi
};
