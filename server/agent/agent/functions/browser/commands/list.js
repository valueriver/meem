import { listSessions } from "../core/sessions.js";

export const browserList = async () => ({ sessions: listSessions() });
