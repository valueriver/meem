import { listTasksByLimit } from "../repository/task/list.js";
const listTaskRecords = ({ limit = 20 } = {}) => {
  const parsed = Number(limit);
  const safeLimit = Number.isFinite(parsed) ? Math.max(1, Math.min(500, parsed)) : 20;
  return listTasksByLimit(safeLimit);
};
export {
  listTaskRecords
};
