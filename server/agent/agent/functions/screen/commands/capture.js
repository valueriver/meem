import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

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

const IS_MAC = process.platform === "darwin";
const IS_LINUX = process.platform === "linux";

const runSpawn = (cmd, args) =>
  new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    proc.on("error", reject);
    proc.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });

export const screenCapture = async ({ mode = "screen" } = {}) => {
  const dir = path.join(SCREENSHOT_DIR, todayFolder());
  fs.mkdirSync(dir, { recursive: true });
  const filepath = path.join(dir, `desktop-${randomUUID()}.png`);

  if (IS_MAC) {
    // -x 静音,-C 包含鼠标;-i 交互选区
    const args =
      mode === "selection" ? ["-x", "-i", filepath] : ["-x", filepath];
    await runSpawn("screencapture", args);
  } else if (IS_LINUX) {
    const args = mode === "selection" ? ["-s", filepath] : [filepath];
    await runSpawn("scrot", args);
  } else {
    throw new Error(
      `screen_capture not supported on platform: ${process.platform}`,
    );
  }

  if (!fs.existsSync(filepath)) {
    // 用户在 selection 模式按 Esc 取消时 screencapture 会正常退出但不生成文件
    throw new Error("screenshot not created (cancelled?)");
  }

  return { path: filepath, mode };
};
