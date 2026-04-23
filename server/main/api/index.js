import { json } from "../../shared/http/json.js";
import { handleChatApi } from "./chat.js";
import { handleMemoryApi } from "./memory.js";
import { handleSettingsApi } from "./settings.js";
import { handleFilesApi } from "./files.js";
import { handleFsApi } from "./fs.js";
import { handleTaskApi } from "./task.js";
import { handleSystemApi } from "./system.js";
import { getConnectionInfo } from "../system/connection.js";
import { getRelayStatus } from "../service/system/relay.js";
const handleApiRequest = async (req, res, url) => {
  const path = url.pathname;
  try {
    if (path === "/api/health") {
      json(res, { success: true });
      return true;
    }
    if (path === "/api/me") {
      const connection = getConnectionInfo(req);
      const relay = await getRelayStatus();
      json(res, {
        authenticated: true,
        requiresPassword: false,
        locked: false,
        email: null,
        via: connection.via,
        connection,
        relay
      });
      return true;
    }
    if (path === "/api/auth/challenge") {
      json(res, { requiresPassword: false });
      return true;
    }
    if (path === "/api/auth/submit") {
      json(res, { token: "localhost-no-auth" });
      return true;
    }
    if (path.startsWith("/api/system/")) {
      await handleSystemApi(req, res, path);
      return true;
    }
    if (path.startsWith("/api/chat/")) {
      await handleChatApi(req, res, path, url);
      return true;
    }
    if (path.startsWith("/api/settings")) {
      await handleSettingsApi(req, res, path);
      return true;
    }
    if (path.startsWith("/api/memory/")) {
      await handleMemoryApi(req, res, path);
      return true;
    }
    if (path.startsWith("/api/files/")) {
      await handleFilesApi(req, res, path);
      return true;
    }
    if (path === "/api/fs" || path.startsWith("/api/fs/")) {
      await handleFsApi(req, res, path, url);
      return true;
    }
    if (path.startsWith("/api/task")) {
      await handleTaskApi(req, res, path, url);
      return true;
    }
    json(res, { success: false, message: "API endpoint not found" }, 404);
    return true;
  } catch (error) {
    json(res, { success: false, message: error.message || "Internal server error" }, 500);
    return true;
  }
};
export {
  handleApiRequest
};
