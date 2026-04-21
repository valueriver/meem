import { chat } from "../agent/handler.js";
import { getSettings } from "../service/settings/get.js";
import { buildSystemPrompt } from "../prompt/index.js";
import { injectAttachmentsMessage } from "./attachments.js";
import { getMessages, saveMessage } from "./messages.js";
import { hasChat } from "./chats.js";
const createSession = (wsSend) => {
  const conversations = /* @__PURE__ */ new Map();
  const handleMessage = async (data) => {
    if (data.type === "ping") {
      wsSend({ type: "pong" });
      return;
    }
    if (data.type === "abort") {
      const cid = data.conversationId;
      if (cid && conversations.has(cid)) {
        conversations.get(cid).abortController.abort();
      }
      return;
    }
    if (data.type === "message") {
      const cid = data.conversationId || null;
      if (!cid) {
        wsSend({ type: "error", content: "Missing conversationId" });
        return;
      }
      if (!hasChat(cid)) {
        wsSend({ type: "error", content: "Conversation not found. Create a new conversation and try again." });
        return;
      }
      if (conversations.has(cid)) {
        conversations.get(cid).abortController.abort();
        await new Promise((r) => {
          const check = () => conversations.has(cid) ? setTimeout(check, 50) : r();
          check();
        });
      }
      const settings = getSettings();
      const {
        contextRounds,
        apiUrl,
        apiKey,
        model,
        provider,
        enableToolResultTruncate,
        toolResultMaxChars,
        enableToolLoopLimit,
        toolMaxRounds
      } = settings;
      const historyMessages = getMessages(cid, contextRounds).map((message) => {
        if (message?.role !== "user") return message;
        const attachments = Array.isArray(message._meta?.attachments) ? message._meta.attachments : [];
        if (!attachments.length) return message;
        const injected = injectAttachmentsMessage([message], attachments);
        return injected.messages[0] || message;
      });
      const messages = [{
        role: "system",
        content: buildSystemPrompt(cid)
      }, ...historyMessages];
      const userMsg = { role: "user", content: data.content };
      let userMeta = null;
      let modelUserMsg = userMsg;
      if (Array.isArray(data.attachments) && data.attachments.length > 0) {
        const injected = injectAttachmentsMessage([userMsg], data.attachments);
        modelUserMsg = injected.messages[0] || userMsg;
        if (injected.attachments.length > 0) {
          userMeta = { attachments: injected.attachments };
        }
      }
      messages.push(userMsg);
      const modelMessages = [...messages];
      modelMessages[modelMessages.length - 1] = modelUserMsg;
      saveMessage(cid, userMsg, userMeta);
      const abortController = new AbortController();
      conversations.set(cid, { abortController });
      const send = (msg) => {
        if (msg.type === "delta") {
          wsSend({ type: "delta", conversationId: cid, delta: msg.delta || "" });
          return;
        }
        if (msg.type === "assistant_tool_calls") {
          if (msg.message) saveMessage(cid, msg.message, null);
          return;
        }
        if (msg.type === "tool_call") {
          wsSend({ type: "tool_call", conversationId: cid, toolCall: msg.toolCall });
          return;
        }
        if (msg.type === "tool_result") {
          if (msg.message) saveMessage(cid, msg.message, null);
          wsSend({
            type: "tool_result",
            conversationId: cid,
            toolCallId: msg.message?.tool_call_id,
            content: msg.message?.content ?? ""
          });
          return;
        }
        if (msg.type === "done") {
          if (msg.message) {
            const rawContent = String(msg.message.content || "");
            saveMessage(cid, msg.message);
            wsSend({
              type: "done",
              conversationId: cid,
              content: rawContent
            });
            return;
          }
          wsSend({ type: "done", conversationId: cid });
          return;
        }
      };
      try {
        await chat(modelMessages, {
          provider,
          apiUrl,
          apiKey,
          model,
          send,
          signal: abortController.signal,
          maxRounds: enableToolLoopLimit ? toolMaxRounds : 1e5,
          enableToolResultTruncate,
          toolResultMaxChars
        });
      } catch (e) {
        if (e.name === "AbortError") {
          wsSend({ type: "aborted", conversationId: cid });
        } else {
          wsSend({ type: "error", conversationId: cid, content: e.message });
        }
      } finally {
        conversations.delete(cid);
      }
    }
  };
  return { handleMessage };
};
export {
  createSession
};
