import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";
import { spawn } from "node:child_process";
import { requestReload, runReload } from "../service/system/reload.js";
import { runReloadTest } from "../service/system/test.js";
import { hasConfiguredModelSettings } from "../service/settings/get.js";
import { requestAgentJson } from "../clients/agent.js";
import { getConnectionInfo, isLoopbackAddress } from "../system/connection.js";
import { getRelayConfig, getRelayStatus, saveRelayConfig, startRelay, stopRelay } from "../service/system/relay.js";

const logReloadRequest = (req, body, stage, extra = {}) => {
  console.log("[reload.request]", JSON.stringify({
    stage,
    body,
    user: null,
    remoteAddress: req.socket?.remoteAddress || "",
    forwardedFor: String(req.headers["x-forwarded-for"] || ""),
    referer: String(req.headers.referer || ""),
    userAgent: String(req.headers["user-agent"] || ""),
    ...extra
  }));
};

const isLocalRequest = (req) => isLoopbackAddress(req.socket?.remoteAddress);

const hasConfiguredAgentSettings = async () => {
  try {
    const data = await requestAgentJson("/api/settings");
    const settings = data.settings || {};
    return Boolean(settings.apiUrl && settings.apiKey && settings.model);
  } catch {
    return hasConfiguredModelSettings();
  }
};

const runLocalCommand = ({ command, cwd }) => new Promise((resolve) => {
  const child = spawn(process.env.SHELL || "/bin/bash", ["-lc", command], {
    cwd: String(cwd || "").trim() || process.cwd()
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr.on("data", (chunk) => { output += chunk.toString(); });
  child.on("error", (error) => resolve(`error: ${error.message}`));
  child.on("close", (code, signal) => {
    resolve(output + (code === 0 ? "" : `\n[exit code=${code}, signal=${signal || ""}]`));
  });
});

const handleSystemApi = async (req, res, path) => {
  if (path === "/api/system/setup" && req.method === "GET") {
    return json(res, { success: true, initialized: await hasConfiguredAgentSettings() });
  }
  if (path === "/api/system/connection" && req.method === "GET") {
    return json(res, { success: true, connection: getConnectionInfo(req), relay: await getRelayStatus() });
  }
  if (path === "/api/system/remote" && req.method === "GET") {
    return json(res, { success: true, relay: await getRelayStatus() });
  }
  if (path === "/api/system/remote/config" && req.method === "GET") {
    return json(res, { success: true, config: await getRelayConfig(), relay: await getRelayStatus() });
  }
  if (path === "/api/system/remote/config" && req.method === "POST") {
    const body = await readBody(req);
    const config = await saveRelayConfig(body);
    return json(res, { success: true, config, relay: await getRelayStatus() });
  }
  if (path === "/api/system/remote/start" && req.method === "POST") {
    try {
      return json(res, { success: true, relay: await startRelay() });
    } catch (e) {
      return json(res, { success: false, message: e instanceof Error ? e.message : "Relay start failed" }, 400);
    }
  }
  if (path === "/api/system/remote/stop" && req.method === "POST") {
    return json(res, { success: true, relay: await stopRelay() });
  }
  if (path === "/api/system/debug/exec" && req.method === "POST") {
    if (!isLocalRequest(req)) {
      return json(res, { success: false, message: "Debug API only allows local requests" }, 403);
    }
    const body = await readBody(req);
    const command = String(body.command || "").trim();
    if (!command) {
      return json(res, { success: false, message: "Missing command" }, 400);
    }
    const output = await runLocalCommand({
      command,
      cwd: body.cwd || ""
    });
    return json(res, {
      success: true,
      cwd: String(body.cwd || "").trim() || process.cwd(),
      output
    });
  }
  if (path === "/api/system/reload/request" && req.method === "POST") {
    const body = await readBody(req);
    const build = body.build ?? false;
    const restartApps = body.restartApps === true || body.restart === "apps";
    const restartServer = body.restartServer === true;
    logReloadRequest(req, body, "received", { build, restartApps, restartServer });
    requestReload({
      build,
      restartApps,
      restartServer,
      message: body.message || ""
    });
    return json(res, { success: true, tested: false });
  }
  if (path === "/api/system/reload/test" && req.method === "POST") {
    const body = await readBody(req);
    const build = body.build === true;
    const restartApps = body.restartApps === true || body.restart === "apps";
    const restartServer = body.restartServer === true;
    try {
      await runReloadTest(build, restartApps, restartServer);
      return json(res, { success: true });
    } catch (e) {
      return json(res, { success: false, message: e instanceof Error ? e.message : "System preflight check failed" }, 500);
    }
  }
  if (path === "/api/system/reload" && req.method === "POST") {
    const body = await readBody(req);
    const build = body.build === true;
    const restartApps = body.restartApps === true || body.restart === "apps";
    const restartServer = body.restartServer === true;
    try {
      await runReload(build, restartApps, restartServer, { defer: restartApps || restartServer, delayMs: 300 });
      json(res, { success: true });
    } catch (e) {
      json(res, { success: false, message: e instanceof Error ? e.message : "System reload failed" }, 500);
    }
    return;
  }
  json(res, { error: "API endpoint not found" }, 404);
};
export {
  handleSystemApi
};
