import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { execSync, spawn } from "child_process";
import { listSettingRows } from "../../repository/settings/get.js";
import { saveSetting } from "../../repository/settings/save.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..", "..", "..", "..");
const RELAY_ENTRY = join(ROOT_DIR, "server", "relay", "index.js");
const RELAY_CONFIG = join(ROOT_DIR, "server", "relay", "config.js");

const readEnvConfig = () => ({
  wsUrl: String(process.env.ROAM_RELAY_WS || "").trim(),
  token: String(process.env.ROAM_RELAY_TOKEN || "").trim(),
  deviceId: String(process.env.ROAM_DEVICE_ID || "").trim(),
  mainPort: String(process.env.ROAM_MAIN_PORT || "").trim(),
  mainHost: String(process.env.ROAM_MAIN_HOST || "").trim()
});

const sanitizeConfig = (value = {}) => ({
  wsUrl: String(value.wsUrl || "").trim(),
  token: String(value.token || "").trim(),
  deviceId: String(value.deviceId || "").trim(),
  mainPort: String(value.mainPort || "").trim(),
  mainHost: String(value.mainHost || "").trim()
});

const readDbConfig = () => {
  const rows = listSettingRows();
  const map = {};
  for (const row of rows) map[row.key] = row.value;
  return sanitizeConfig({
    wsUrl: map.relayWsUrl,
    token: map.relayToken,
    deviceId: map.relayDeviceId,
    mainPort: map.relayMainPort,
    mainHost: map.relayMainHost
  });
};

const loadFileConfig = async () => {
  if (!existsSync(RELAY_CONFIG)) return sanitizeConfig();
  try {
    const mod = await import(`${pathToFileURL(RELAY_CONFIG).href}?t=${Date.now()}`);
    return sanitizeConfig(mod.default || mod.config || {});
  } catch {
    return sanitizeConfig();
  }
};

const mergeConfig = (dbConfig, fileConfig, envConfig) => ({
  wsUrl: dbConfig.wsUrl || fileConfig.wsUrl || envConfig.wsUrl,
  token: dbConfig.token || fileConfig.token || envConfig.token,
  deviceId: dbConfig.deviceId || fileConfig.deviceId || envConfig.deviceId,
  mainPort: dbConfig.mainPort || fileConfig.mainPort || envConfig.mainPort || "9508",
  mainHost: dbConfig.mainHost || fileConfig.mainHost || envConfig.mainHost || "127.0.0.1"
});

const maskToken = (token) => {
  const raw = String(token || "").trim();
  if (!raw) return "";
  if (raw.length <= 6) return `${raw.slice(0, 2)}***`;
  return `${raw.slice(0, 3)}***${raw.slice(-2)}`;
};

const publicUrlFromWsUrl = (wsUrl, deviceId) => {
  const input = String(wsUrl || "").trim();
  const slug = String(deviceId || "").trim();
  if (!input || !slug) return "";
  try {
    const url = new URL(input);
    if (url.pathname !== "/ws/device") return "";
    const host = url.hostname.replace(/^relay\./, "roam.");
    if (!host || host === url.hostname) return "";
    return `https://${slug}.${host}/`;
  } catch {
    return "";
  }
};

const getRelayPid = () => {
  try {
    const output = execSync(`pgrep -f "${RELAY_ENTRY.replace(/"/g, '\\"')}"`, {
      stdio: ["ignore", "pipe", "ignore"]
    }).toString("utf8").trim();
    const pid = output.split(/\s+/).find(Boolean);
    return pid ? Number(pid) : null;
  } catch {
    return null;
  }
};

const isRelayRunning = () => Boolean(getRelayPid());

const getRelayStatus = async () => {
  const envConfig = readEnvConfig();
  const dbConfig = readDbConfig();
  const fileConfig = await loadFileConfig();
  const config = mergeConfig(dbConfig, fileConfig, envConfig);
  const configured = Boolean(config.wsUrl && config.deviceId);
  const running = isRelayRunning();
  const configSource = dbConfig.wsUrl || dbConfig.token || dbConfig.deviceId
    ? "database"
    : fileConfig.wsUrl || fileConfig.token || fileConfig.deviceId
      ? "file"
      : envConfig.wsUrl || envConfig.token || envConfig.deviceId
        ? "env"
        : "none";
  return {
    configured,
    running,
    configSource,
    wsUrl: config.wsUrl || "",
    deviceId: config.deviceId || "",
    tokenMasked: maskToken(config.token),
    mainPort: config.mainPort || "9508",
    mainHost: config.mainHost || "127.0.0.1",
    publicUrlHint: publicUrlFromWsUrl(config.wsUrl, config.deviceId),
    pid: getRelayPid()
  };
};

const getRelayConfig = async () => {
  const envConfig = readEnvConfig();
  const dbConfig = readDbConfig();
  const fileConfig = await loadFileConfig();
  const config = mergeConfig(dbConfig, fileConfig, envConfig);
  return {
    wsUrl: config.wsUrl || "",
    token: config.token || "",
    deviceId: config.deviceId || "",
    mainPort: config.mainPort || "9508",
    mainHost: config.mainHost || "127.0.0.1",
    source: dbConfig.wsUrl || dbConfig.token || dbConfig.deviceId
      ? "database"
      : fileConfig.wsUrl || fileConfig.token || fileConfig.deviceId
        ? "file"
        : envConfig.wsUrl || envConfig.token || envConfig.deviceId
          ? "env"
          : "none"
  };
};

const saveRelayConfig = async (input = {}) => {
  if (input.wsUrl !== void 0) saveSetting("relayWsUrl", String(input.wsUrl || "").trim());
  if (input.token !== void 0) saveSetting("relayToken", String(input.token || "").trim());
  if (input.deviceId !== void 0) saveSetting("relayDeviceId", String(input.deviceId || "").trim());
  if (input.mainPort !== void 0) saveSetting("relayMainPort", String(input.mainPort || "").trim() || "9508");
  if (input.mainHost !== void 0) saveSetting("relayMainHost", String(input.mainHost || "").trim() || "127.0.0.1");
  return await getRelayConfig();
};

const startRelay = async () => {
  const envConfig = readEnvConfig();
  const dbConfig = readDbConfig();
  const fileConfig = await loadFileConfig();
  const config = mergeConfig(dbConfig, fileConfig, envConfig);
  const status = await getRelayStatus();
  if (!status.configured) {
    throw new Error("Relay 尚未配置。请先填写 wsUrl 和 deviceId");
  }
  if (status.running) {
    return status;
  }
  const child = spawn(process.execPath, [RELAY_ENTRY], {
    cwd: ROOT_DIR,
    detached: true,
    stdio: "ignore",
    env: {
      ...process.env,
      ROAM_RELAY_WS: config.wsUrl || "",
      ROAM_RELAY_TOKEN: config.token || "",
      ROAM_DEVICE_ID: config.deviceId || "",
      ROAM_MAIN_PORT: status.mainPort || "9508",
      ROAM_MAIN_HOST: status.mainHost || "127.0.0.1"
    }
  });
  child.unref();
  await new Promise((resolve) => setTimeout(resolve, 600));
  return await getRelayStatus();
};

const stopRelay = async () => {
  const pid = getRelayPid();
  if (!pid) {
    return await getRelayStatus();
  }
  try {
    process.kill(pid, "SIGTERM");
  } catch {}
  for (let i = 0; i < 20; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (!isRelayRunning()) break;
  }
  return await getRelayStatus();
};

export {
  getRelayConfig,
  getRelayStatus,
  saveRelayConfig,
  startRelay,
  stopRelay
};
