import { getTask } from "../../repository/tasks/index.js";
import { markTaskAborted } from "../../repository/tasks/index.js";
import { running } from "./_state.js";

const abortTask = (taskId) => {
  const task = getTask(taskId);
  if (!task) throw new Error(`task ${taskId} not found`);
  if (task.status === "done" || task.status === "error" || task.status === "aborted") {
    return task;
  }
  const controller = running.get(taskId);
  if (controller) controller.abort();
  markTaskAborted(taskId);
  return getTask(taskId);
};

export { abortTask };
