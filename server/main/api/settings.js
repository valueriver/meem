import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";
import { getSettings } from "../service/settings/get.js";
import { updateSettings } from "../service/settings/update.js";
import { listSkills } from "../service/skills/list.js";
import { requestAgentJson } from "../clients/agent.js";

const fromAgentSettings = (agentSettings = {}, localSettings = getSettings()) => ({
  ...localSettings,
  apiUrl: agentSettings.apiUrl || localSettings.apiUrl || "",
  apiKey: agentSettings.apiKey || localSettings.apiKey || "",
  model: agentSettings.model || localSettings.model || "",
  systemPrompt: agentSettings.system ?? localSettings.systemPrompt ?? "",
  contextRounds: agentSettings.contextTurns ?? localSettings.contextRounds
});

const toAgentSettings = (body = {}, current = {}) => ({
  apiUrl: body.apiUrl ?? current.apiUrl ?? "",
  apiKey: body.apiKey ?? current.apiKey ?? "",
  model: body.model ?? current.model ?? "",
  system: body.system ?? body.systemPrompt ?? current.system ?? "",
  contextTurns: body.contextTurns ?? body.contextRounds ?? current.contextTurns ?? 10
});

const handleSettingsApi = async (req, res, path) => {
  if (path === "/api/settings" && req.method === "GET") {
    const data = await requestAgentJson("/api/settings");
    return json(res, fromAgentSettings(data.settings || {}));
  }
  if (path === "/api/settings/skills" && req.method === "GET") {
    return json(res, {
      items: listSkills().map(({ content, ...skill }) => skill)
    });
  }
  if (path === "/api/settings" && req.method === "POST") {
    const body = await readBody(req);
    updateSettings(body);
    const current = await requestAgentJson("/api/settings");
    await requestAgentJson("/api/settings", {
      method: "POST",
      body: toAgentSettings(body, current.settings || {})
    });
    const data = await requestAgentJson("/api/settings");
    return json(res, fromAgentSettings(data.settings || {}));
  }
  return json(res, { error: "API endpoint not found" }, 404);
};
export {
  handleSettingsApi
};
