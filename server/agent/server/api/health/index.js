import { handleHealthGet } from "./get.js";

const handleHealthApi = async (req, res, deps, path, method, url, context) => {
  if (path === "/health" && method === "GET") {
    await handleHealthGet(req, res, deps, context);
    return;
  }
};

export { handleHealthApi };
