import { getSettingsRecord } from "../../repository/settings/index.js";

const getServerSettings = () => {
  try {
    const settings = getSettingsRecord();
    return {
      apiUrl: settings.apiUrl || "",
      apiKey: settings.apiKey || "",
      model: settings.model || "",
      system: settings.system || "",
      contextTurns: Number.isInteger(Number(settings.contextTurns)) ? Number(settings.contextTurns) : 10,
    };
  } catch {
    return { apiUrl: "", apiKey: "", model: "", system: "", contextTurns: 10 };
  }
};

export { getServerSettings };
