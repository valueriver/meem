import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";

// Prefer user-local installs (npm global, homebrew) over /usr/local/bin
// so we pick up newer codex/claude versions the user actually uses.
const ENHANCED_PATH = [
  path.join(os.homedir(), ".npm-global", "bin"),
  path.join(os.homedir(), ".local", "bin"),
  "/opt/homebrew/bin",
  "/usr/local/bin",
  process.env.PATH || ""
].filter(Boolean).join(":");

const codexEnv = () => ({ ...process.env, PATH: ENHANCED_PATH });

const runCmd = (cmd, args, opts = {}) =>
  new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    const child = spawn(cmd, args, { shell: false, env: codexEnv(), ...opts });
    child.stdout?.on("data", (d) => (stdout += d.toString()));
    child.stderr?.on("data", (d) => (stderr += d.toString()));
    child.on("error", () => resolve({ ok: false, stdout, stderr, code: -1 }));
    child.on("close", (code) => resolve({ ok: code === 0, stdout, stderr, code }));
  });

const getCodexStatus = async () => {
  const which = await runCmd("bash", ["-c", `PATH="${ENHANCED_PATH}" command -v codex`]);
  if (!which.ok || !which.stdout.trim()) {
    return { installed: false, version: null, cliPath: null };
  }
  const cliPath = which.stdout.trim().split("\n").pop();
  const ver = await runCmd(cliPath, ["--version"]);
  const version = ver.ok ? ver.stdout.trim() : null;
  return { installed: true, version, cliPath };
};

export { getCodexStatus, codexEnv, ENHANCED_PATH };
