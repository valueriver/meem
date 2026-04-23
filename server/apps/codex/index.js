import { handleCodexApi } from "./api/index.js";
import { initCodexDatabase } from "./repository/init.js";

export default {
  name: "codex",
  match: (path) => path.startsWith("/apps/codex/"),
  initDb: initCodexDatabase,
  handleApi: handleCodexApi
};
