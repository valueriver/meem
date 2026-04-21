import { reactive, shallowRef } from 'vue';

const TASKBAR_H = 44;
const WINDOW_Z_BASE = 10;

const state = reactive({
  windows: [],
  nextZ: WINDOW_Z_BASE
});

function rebalanceZ(activeWindowId = null) {
  const ordered = [...state.windows].sort((a, b) => a.zIndex - b.zIndex);
  const active = activeWindowId ? ordered.find((win) => win.id === activeWindowId) : null;
  const rest = active ? ordered.filter((win) => win.id !== activeWindowId) : ordered;
  rest.forEach((win, index) => {
    win.zIndex = WINDOW_Z_BASE + index;
  });
  if (active) {
    active.zIndex = WINDOW_Z_BASE + rest.length;
  }
  state.nextZ = WINDOW_Z_BASE + Math.max(0, state.windows.length - 1);
}

async function openComponent(options = {}) {
  const {
    key,
    appId,
    title,
    icon,
    load,
    defaultDesktopWindowSize = {},
    minDesktopWindowSize = {},
    props = {},
    singleton = true
  } = options;

  const existing = singleton ? state.windows.find((w) => w.windowKey === key) : null;
  if (existing) {
    Object.assign(existing.props, props);
    if (existing.state === 'minimized') existing.state = 'normal';
    focus(existing.id);
    return existing;
  }

  const mod = await load();
  const component = shallowRef(mod.default);
  const cascade = (state.windows.length % 8) * 30;
  const dw = defaultDesktopWindowSize.w || 800;
  const dh = defaultDesktopWindowSize.h || 560;
  const win = reactive({
    id: `${key}-${Date.now()}`,
    windowKey: key,
    appId,
    title,
    icon,
    component,
    props: { ...props },
    x: 120 + cascade,
    y: 60 + cascade,
    w: Math.min(dw, window.innerWidth - 80),
    h: Math.min(dh, window.innerHeight - 80),
    minW: minDesktopWindowSize.w || 360,
    minH: minDesktopWindowSize.h || 280,
    zIndex: WINDOW_Z_BASE,
    state: 'normal',
    prevRect: null
  });
  win.props.__windowId = win.id;
  state.windows.push(win);
  rebalanceZ(win.id);
  return win;
}

async function openWindow(windowConfig, props = {}) {
  const windowKey = windowConfig?.key || windowConfig?.id;
  if (!windowKey || typeof windowConfig.desktopLoad !== 'function') return null;
  return openComponent({
    key: windowKey,
    appId: windowConfig.appId || windowConfig.id || windowKey,
    title: windowConfig.title || windowConfig.name || windowKey,
    icon: windowConfig.icon,
    load: windowConfig.desktopLoad,
    defaultDesktopWindowSize: windowConfig.defaultDesktopWindowSize,
    minDesktopWindowSize: windowConfig.minDesktopWindowSize,
    props
  });
}

function close(windowId) {
  const idx = state.windows.findIndex((w) => w.id === windowId);
  if (idx !== -1) {
    state.windows.splice(idx, 1);
    rebalanceZ();
  }
}

function closeAll() {
  state.windows.splice(0);
  state.nextZ = WINDOW_Z_BASE;
}

function minimize(windowId) {
  const win = state.windows.find((w) => w.id === windowId);
  if (win) win.state = 'minimized';
}

function maximize(windowId) {
  const win = state.windows.find((w) => w.id === windowId);
  if (!win) return;
  if (win.state === 'maximized') {
    if (win.prevRect) {
      Object.assign(win, win.prevRect);
      win.prevRect = null;
    }
    win.state = 'normal';
  } else {
    win.prevRect = { x: win.x, y: win.y, w: win.w, h: win.h };
    win.x = 0;
    win.y = 0;
    win.w = window.innerWidth;
    win.h = window.innerHeight - TASKBAR_H;
    win.state = 'maximized';
  }
}

function focus(windowId) {
  if (state.windows.some((w) => w.id === windowId)) {
    rebalanceZ(windowId);
  }
}

function updatePosition(windowId, x, y) {
  const win = state.windows.find((w) => w.id === windowId);
  if (win) {
    win.x = x;
    win.y = y;
  }
}

function updateSize(windowId, w, h) {
  const win = state.windows.find((w) => w.id === windowId);
  if (win) {
    win.w = Math.max(w, win.minW);
    win.h = Math.max(h, win.minH);
  }
}

const windowManager = {
  state,
  openWindow,
  openComponent,
  close,
  closeAll,
  minimize,
  maximize,
  focus,
  updatePosition,
  updateSize
};

export {
  windowManager
};
