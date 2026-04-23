import { listMemosBefore } from "../../repository/memos/index.js";
import { getChat } from "../../repository/chats/index.js";
import { listMemories } from "../../repository/memories/index.js";

const buildConversationContext = (conversationId, contextMessages) => {
  const chat = getChat(conversationId);
  if (!chat) return "";
  const boundaryId = contextMessages
    .map((m) => m._id)
    .filter((id) => Number.isFinite(id))
    .reduce((min, id) => (min === null || id < min ? id : min), null);
  const outOfContextMemos = boundaryId
    ? listMemosBefore(conversationId, boundaryId, 30)
    : [];

  const lines = ["<conversation>"];
  lines.push(`title: ${chat.title || ""}`);
  lines.push(`summary: ${chat.summary || ""}`);
  if (outOfContextMemos.length) {
    lines.push("");
    lines.push(`memos (out of context window, newest-first, up to 30):`);
    for (const m of outOfContextMemos) {
      lines.push(`- [#${m.id}] ${m.content}`);
    }
  }
  lines.push("</conversation>");
  return lines.join("\n");
};

const buildMemoriesContext = () => {
  const pinned = listMemories({ enabled: 1, visibility: "pinned" });
  const starred = listMemories({ enabled: 1, visibility: "starred" });
  if (pinned.length === 0 && starred.length === 0) return "";

  const lines = ["<memories>"];

  if (pinned.length) {
    lines.push("");
    lines.push("[pinned] 以下是必读内容,请视作常识:");
    for (const m of pinned) {
      lines.push("");
      lines.push(`## ${m.title}`);
      if (m.description) lines.push(`_${m.description}_`);
      lines.push(m.content);
    }
  }

  if (starred.length) {
    lines.push("");
    lines.push(
      "[starred] 以下记忆只列出了标题和描述,完整内容用 memory_get(id) 读取:",
    );
    for (const m of starred) {
      const desc = m.description ? ` — ${m.description}` : "";
      lines.push(`- #${m.id} · ${m.title}${desc}`);
    }
  }

  lines.push("");
  lines.push(
    "还有更多隐藏记忆,遇到你不认识的名词/偏好时先 memory_search(query) 找一下。",
  );

  lines.push("</memories>");
  return lines.join("\n");
};

export { buildConversationContext, buildMemoriesContext };
