import { parseJson } from "../../utils.js";
import { runConversationChat } from "../../services/chat/index.js";
import { normalizeConversationId } from "../../services/chats/index.js";

const handleChatPost = async (req, res, { openSse, readBody, sendSse }) => {
  const raw = await readBody(req);
  const body = parseJson(raw || "{}", "server.chat.body");
  const conversationId = normalizeConversationId(body.conversationId);

  openSse(res);
  sendSse(res, "connected", { ok: true, conversationId });

  const controller = new AbortController();
  req.once("close", () => {
    controller.abort();
  });

  try {
    await runConversationChat(conversationId, body, {
      signal: controller.signal,
      onEvent: (event) => {
        sendSse(res, event.type, event);
      },
    });
  } catch (error) {
    if (error?.name !== "AbortError") {
      sendSse(res, "error", {
        ok: false,
        conversationId,
        error: error.message,
      });
    }
  } finally {
    if (!res.writableEnded && !res.destroyed) {
      try {
        res.end();
      } catch {
        // already closed
      }
    }
  }
};

export { handleChatPost };
