import { getServerSettings } from "../../services/settings/index.js";

const handleSettingsGet = async (_req, res, { sendJson }) => {
  sendJson(res, 200, { ok: true, settings: getServerSettings() });
};

export { handleSettingsGet };
