import { resolve, sep } from "path";

const CHAT_UPLOAD_BASE_DIR = resolve(process.cwd(), "files", "uploads", "chat");

const pathStartsWith = (fullPath, basePath) => fullPath === basePath || fullPath.startsWith(`${basePath}${sep}`);

const injectAttachmentsMessage = (messages = [], rawAttachments = []) => {
  const list = Array.isArray(messages) ? [...messages] : [];
  if (!Array.isArray(rawAttachments) || rawAttachments.length === 0 || list.length === 0) {
    return { messages: list, attachments: [] };
  }
  const validAttachments = [];
  const contextParts = [];
  const fileParts = [];
  for (const item of rawAttachments) {
    if (!item) continue;
    if (item.type === "context") {
      const label = String(item.label || "").trim();
      if (label) {
        validAttachments.push({ type: "context", scene: item.scene, label });
        contextParts.push(`[当前应用: ${label}]`);
      }
      continue;
    }
    if (item.type !== "file") continue;
    const name = String(item.name || "").trim();
    const path = String(item.path || "").trim();
    const size = Number(item.size || 0);
    if (!name || !path) continue;
    const abs = resolve(path);
    if (!pathStartsWith(abs, CHAT_UPLOAD_BASE_DIR)) continue;
    validAttachments.push({ type: "file", name, path: abs, size });
    fileParts.push(`${fileParts.length + 1}. ${name}: ${abs}`);
  }
  if (!validAttachments.length) return { messages: list, attachments: [] };
  const parts = [];
  if (contextParts.length) parts.push(contextParts.join("\n"));
  if (fileParts.length) {
    parts.push(["【附件文件路径】", ...fileParts, "请先读取这些文件内容，再结合用户问题回答。"].join("\n"));
  }
  if (parts.length) {
    const lastIndex = list.length - 1;
    const original = list[lastIndex];
    list[lastIndex] = {
      ...original,
      content: `${original?.content ?? ""}

${parts.join("\n\n")}`
    };
  }
  return { messages: list, attachments: validAttachments };
};
export {
  injectAttachmentsMessage
};
