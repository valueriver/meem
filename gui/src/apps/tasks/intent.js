const intent = {
  async open({ payload, existingWindow, openWindow, focusWindow }) {
    const action = payload.action || 'open';

    if (action === 'open') {
      if (existingWindow) {
        focusWindow(existingWindow.id);
        return existingWindow;
      }
      return openWindow();
    }

    throw new Error(`Unsupported tasks intent action: ${action}`);
  }
};

export {
  intent
};
