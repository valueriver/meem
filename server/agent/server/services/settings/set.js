import { setSettingsRecord } from "../../repository/settings/index.js";

const setServerSettings = (settings) => {
  setSettingsRecord({
    apiUrl: settings.apiUrl || "",
    apiKey: settings.apiKey || "",
    model: settings.model || "",
    system: settings.system || "",
    contextTurns: Math.max(0, Number.parseInt(settings.contextTurns, 10) || 0),
  });
};

export { setServerSettings };
