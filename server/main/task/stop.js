import { broadcast } from "../system/ws.js";
import { getTaskStatusById, markTaskAbortedById } from "../repository/task/stop.js";
import { stopTaskExecution } from "./execution.js";
const stopTask = ({ id }) => {
  const task = getTaskStatusById(id);
  if (!task) return { status: 404, message: "Task not found" };
  if (task.status !== "pending") return { status: 400, message: "Task is not running" };
  const stopped = stopTaskExecution(id);
  markTaskAbortedById(id);
  broadcast({ type: "tasks_changed" });
  return { success: true, stopped };
};
export {
  stopTask
};
