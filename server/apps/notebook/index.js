import { handleNotebookApi } from "./api/index.js";
import { initNotebookDatabase } from "./repository/init.js";
var stdin_default = {
  name: "notebook",
  match: (path) => path.startsWith("/apps/notebook/"),
  initDb: initNotebookDatabase,
  handleApi: handleNotebookApi
};
export {
  stdin_default as default
};
