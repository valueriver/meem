import { saveSetting } from "../../repository/settings/save.js";
import { normalizeContextRounds } from "./get.js";
const clampToolResultMaxChars = (value) => {
  return Math.max(1e3, Math.min(5e4, Number(value) || 12e3));
};
const clampToolMaxRounds = (value) => {
  return Math.max(1, Math.min(500, Number(value) || 50));
};
const updateSettings = (body = {}) => {
  if (body.provider !== void 0) saveSetting("provider", body.provider);
  if (body.systemPrompt !== void 0) saveSetting("systemPrompt", body.systemPrompt);
  if (body.contextRounds !== void 0) saveSetting("contextRounds", String(normalizeContextRounds(body.contextRounds)));
  if (body.apiUrl !== void 0) saveSetting("apiUrl", body.apiUrl);
  if (body.apiKey !== void 0) saveSetting("apiKey", body.apiKey);
  if (body.model !== void 0) saveSetting("model", body.model);
  if (body.enableToolResultTruncate !== void 0) saveSetting("enableToolResultTruncate", body.enableToolResultTruncate ? "1" : "0");
  if (body.toolResultMaxChars !== void 0) saveSetting("toolResultMaxChars", String(clampToolResultMaxChars(body.toolResultMaxChars)));
  if (body.enableToolLoopLimit !== void 0) saveSetting("enableToolLoopLimit", body.enableToolLoopLimit ? "1" : "0");
  if (body.toolMaxRounds !== void 0) saveSetting("toolMaxRounds", String(clampToolMaxRounds(body.toolMaxRounds)));
  return { ok: true };
};
export {
  updateSettings
};
