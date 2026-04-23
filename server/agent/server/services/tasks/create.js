import { randomUUID } from "crypto";
import { saveMessageBatch } from "../../repository/messages/index.js";
import {
  createTaskRow,
  markTaskDone,
  markTaskError,
  markTaskRunning,
} from "../../repository/tasks/index.js";
import { runConversationChat } from "../chat/run.js";
import { running } from "./_state.js";
import { getLastAssistantMessage } from "./utils.js";

const runTaskInBackground = async ({
  taskId,
  conversationId,
  taskName,
  input,
}) => {
  const controller = new AbortController();
  running.set(taskId, controller);
  markTaskRunning(taskId);

  try {
    const { result } = await runConversationChat(conversationId, input, {
      signal: controller.signal,
    });
    const lastAssistant = getLastAssistantMessage(result.messages);
    const summary = lastAssistant?.content || result.text || "";
    markTaskDone(taskId, summary);
  } catch (error) {
    if (error?.name === "AbortError") {
      return;
    }
    markTaskError(taskId, error.message);
  } finally {
    running.delete(taskId);
  }
};

const createTask = ({ taskName, detail, messages, inputOverrides = {} }) => {
  const initialMessages = Array.isArray(messages)
    ? messages
    : String(detail || "").trim()
      ? [{ role: "user", content: String(detail).trim() }]
      : [];

  if (initialMessages.length === 0) {
    throw new Error("detail is required");
  }

  const promptText =
    initialMessages.find((m) => m.role === "user")?.content || "";

  // Task 独立拥有 conversation_id,不写 chats 表。
  // messages / memos 共享底层存储,但不会污染 chat 列表。
  const conversationId = randomUUID();

  saveMessageBatch(conversationId, initialMessages);
  const taskId = createTaskRow({
    conversationId,
    name: taskName,
    prompt: String(promptText || ""),
  });

  void runTaskInBackground({
    taskId,
    conversationId,
    taskName,
    input: {
      conversationId,
      messages: initialMessages,
      ...inputOverrides,
    },
  });

  return { taskId, taskName, conversationId };
};

export { createTask, runTaskInBackground };
