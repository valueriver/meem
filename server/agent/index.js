import { startServer } from "./server/index.js";

const port = Number(process.env.ROAM_AGENT_PORT || process.env.AGENT_PORT) || 9507;

console.log(`Starting AGENT server on port ${port}...`);
await startServer(port);
