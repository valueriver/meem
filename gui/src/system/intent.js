import { getApp } from "../apps.js";
import { windowManager } from "./windows.js";

const intentCache = new Map();

const loadIntent = async (app) => {
  if (!app?.intent) return null;
  const appKey = app.id;
  if (intentCache.has(appKey)) return intentCache.get(appKey);
  const mod = await app.intent();
  const handler = mod?.intent || mod?.default || null;
  intentCache.set(appKey, handler);
  return handler;
};

const normalizeIntentPayload = (payload = {}) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Intent payload must be an object");
  }
  const app = String(payload.app || "").trim();
  if (!app) {
    throw new Error("Intent payload must include app");
  }
  return {
    action: String(payload.action || "open").trim(),
    app,
    data: payload.data && typeof payload.data === "object" && !Array.isArray(payload.data) ? payload.data : {}
  };
};

const openIntent = async (payload) => {
  const normalized = normalizeIntentPayload(payload);
  const app = getApp(normalized.app);
  if (!app) {
    throw new Error(`Unknown app: ${normalized.app}`);
  }

  const handler = await loadIntent(app);
  const existingWindow = windowManager.state.windows.find((win) => win.windowKey === app.id) || null;
  if (!handler?.open) {
    return windowManager.openWindow(app, normalized.props || {});
  }

  return handler.open({
    payload: normalized,
    app,
    existingWindow,
    openWindow: (props = {}) => windowManager.openWindow(app, props),
    openApp: (targetAppId, props = {}) => {
      const targetApp = getApp(targetAppId);
      return targetApp ? windowManager.openWindow(targetApp, props) : null;
    },
    openComponent: (options = {}) => windowManager.openComponent({
      appId: options.appId || app.id,
      icon: options.icon || app.icon,
      title: options.title || app.name,
      load: options.load || options.desktopLoad,
      ...options
    }),
    focusWindow: (windowId) => windowManager.focus(windowId),
    closeWindow: (windowId) => windowManager.close(windowId)
  });
};

export {
  normalizeIntentPayload,
  openIntent
};
