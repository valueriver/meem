import { db } from "../repository/client.js";

const memory = () => {
  let rows;
  try {
    rows = db.prepare(
      "SELECT title, description, content, pinned FROM memories WHERE enabled = 1 ORDER BY pinned DESC, id ASC"
    ).all();
  } catch {
    return "";
  }
  if (!rows.length) return "";
  const sections = rows.map((r) => {
    if (r.pinned) return `### ${r.title}\n${r.content}`;
    const desc = r.description ? ` — ${r.description}` : "";
    return `- ${r.title}${desc}`;
  });
  const pinned = rows.filter((r) => r.pinned);
  const enabled = rows.filter((r) => !r.pinned);
  const parts = [];
  if (pinned.length) {
    parts.push(pinned.map((r) => `### ${r.title}\n${r.content}`).join("\n\n"));
  }
  if (enabled.length) {
    parts.push("以下记忆已启用（需要时可通过工具查看详情）：\n" + enabled.map((r) => {
      const desc = r.description ? ` — ${r.description}` : "";
      return `- ${r.title}${desc}`;
    }).join("\n"));
  }
  return `\n\n## 记忆\n${parts.join("\n\n")}`;
};

export { memory };
