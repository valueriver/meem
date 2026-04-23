import { requestAgentJson } from "../../clients/agent.js";
import { getSettings } from "../settings/get.js";

const syncAgentSettingsFromMain = async () => {
  const local = getSettings();
  if (!local.apiUrl || !local.apiKey || !local.model) return;
  try {
    const remote = await requestAgentJson("/api/settings");
    const settings = remote.settings || {};
    if (settings.apiUrl && settings.apiKey && settings.model) return;
    await requestAgentJson("/api/settings", {
      method: "POST",
      body: {
        apiUrl: local.apiUrl,
        apiKey: local.apiKey,
        model: local.model,
        system: local.systemPrompt || "",
        contextTurns: local.contextRounds || 10
      }
    });
  } catch (error) {
    console.warn("[agent-bootstrap] settings sync skipped:", error.message);
  }
};

export {
  syncAgentSettingsFromMain
};
