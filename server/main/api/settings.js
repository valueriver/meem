import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";
import { getSettings } from "../service/settings/get.js";
import { updateSettings } from "../service/settings/update.js";
import { listSkills } from "../service/skills/list.js";
const handleSettingsApi = async (req, res, path) => {
  if (path === "/api/settings" && req.method === "GET") {
    return json(res, getSettings());
  }
  if (path === "/api/settings/skills" && req.method === "GET") {
    return json(res, {
      items: listSkills().map(({ content, ...skill }) => skill)
    });
  }
  if (path === "/api/settings" && req.method === "POST") {
    const body = await readBody(req);
    updateSettings(body);
    return json(res, getSettings());
  }
  return json(res, { error: "API endpoint not found" }, 404);
};
export {
  handleSettingsApi
};
