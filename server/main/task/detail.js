import { getTaskById } from "../repository/task/detail.js";
const getTaskDetail = ({ id }) => {
  return getTaskById(id);
};
export {
  getTaskDetail
};
