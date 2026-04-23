import { handleClaudeCodeApi } from "./api/index.js";
import { initClaudeCodeDatabase } from "./repository/init.js";

export default {
  name: "claude-code",
  match: (path) => path.startsWith("/apps/claude-code/"),
  initDb: initClaudeCodeDatabase,
  handleApi: handleClaudeCodeApi
};
