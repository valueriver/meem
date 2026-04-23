import { chat } from "../../../agent/handler.js";
import { saveMessageBatch } from "../../repository/messages/index.js";
import { prepareChatInput } from "./prepare.js";

const runConversationChat = async (conversationId, input = {}, options = {}) => {
  const prepared = await prepareChatInput({ ...input, conversationId });
  const { onEvent, signal } = options;
  onEvent?.({ type: "start", ok: true, conversationId });

  try {
    const result = await chat(prepared.messages, {
      ...prepared.settings,
      signal,
      onEvent: (event) => onEvent?.(event),
    });

    const persistedMessages = result.messages
      .filter((message) => message.role !== "system")
      .slice(prepared.contextMessages.length);

    if (persistedMessages.length > 0) {
      saveMessageBatch(conversationId, persistedMessages);
    }

    onEvent?.({ type: "saved", ok: true, conversationId });
    onEvent?.({ type: "end", ok: true, conversationId });
    return { result, storage: "sqlite" };
  } catch (error) {
    if (error?.name === "AbortError") {
      onEvent?.({ type: "stopped", ok: true, conversationId });
    }
    throw error;
  }
};

export { runConversationChat };
