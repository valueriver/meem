const runningTaskControllers = /* @__PURE__ */ new Map();
const registerTaskExecution = (taskId, abortController) => {
  if (!taskId || !abortController) return;
  runningTaskControllers.set(taskId, abortController);
};
const unregisterTaskExecution = (taskId) => {
  if (!taskId) return;
  runningTaskControllers.delete(taskId);
};
const stopTaskExecution = (taskId) => {
  const controller = runningTaskControllers.get(taskId);
  if (!controller) return false;
  controller.abort();
  return true;
};
export {
  registerTaskExecution,
  stopTaskExecution,
  unregisterTaskExecution
};
