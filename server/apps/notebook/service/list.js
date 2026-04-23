import { listNotes } from "../repository/list.js";
const listNotebook = ({ q = "", page = 1, pageSize = 10 } = {}) => {
  return listNotes({ keyword: q, page, pageSize });
};
export {
  listNotebook
};
