import os from "os";
import path from "path";
import fs from "fs";
const fsp = fs.promises;

export const getDefaultShell = () =>
  os.platform() === "win32" ? "powershell.exe" : (process.env.SHELL || "bash");

export const getDefaultDirectory = () => {
  const desktop = path.join(os.homedir(), "Desktop");
  return fs.existsSync(desktop) ? desktop : os.homedir();
};

export const ensureDirectory = async (cwd) => {
  const target = cwd && String(cwd).trim() ? String(cwd).trim() : getDefaultDirectory();
  const resolved = path.resolve(target);
  const st = await fsp.stat(resolved);
  if (!st.isDirectory()) throw new Error("启动目录不是文件夹");
  return resolved;
};
