import { instantTask } from "../../app_shared/instantTask.js";
const optimizeNotebook = async ({ content, prompt, taskTitle, req }) => {
  if (!content?.trim()) return { error: "Content is required", status: 400 };
  const promptText = String(prompt || "").trim();
  if (!promptText) return { error: "prompt is required", status: 400 };
  const data = await instantTask({
    app: "notebook",
    title: String(taskTitle || "").trim() || "笔记润色",
    prompt: promptText,
    req
  });
  const result = (data.response || "").trim();
  if (!result) return { error: "Optimization result is empty", status: 500 };
  return { result };
};
export {
  optimizeNotebook
};
