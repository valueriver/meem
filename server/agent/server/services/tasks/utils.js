const sanitizeTaskName = (taskName) => {
  const value = String(taskName || "").trim();
  if (!value) throw new Error("taskName is required");
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "task";
};

const getLastAssistantMessage = (messages = []) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "assistant") return messages[index];
  }
  return null;
};

export { getLastAssistantMessage, sanitizeTaskName };
