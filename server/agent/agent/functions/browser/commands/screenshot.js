import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { enqueue, getSession } from "../core/sessions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.resolve(
  __dirname,
  "../../../../database/screenshots",
);

const todayFolder = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
};

export const browserScreenshot = async ({
  sessionId,
  selector,
  fullPage = false,
} = {}) => {
  const sess = getSession(sessionId);
  const dir = path.join(SCREENSHOT_DIR, todayFolder());
  fs.mkdirSync(dir, { recursive: true });
  const filepath = path.join(dir, `${randomUUID()}.png`);

  await enqueue(sess, async () => {
    if (selector) {
      await sess.page.locator(String(selector)).screenshot({ path: filepath });
    } else {
      await sess.page.screenshot({ path: filepath, fullPage: !!fullPage });
    }
  });

  return { path: filepath, url: sess.page.url() };
};
