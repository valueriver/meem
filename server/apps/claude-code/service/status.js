import { spawn } from "node:child_process";

const runCmd = (cmd, args, opts = {}) =>
  new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    const child = spawn(cmd, args, { shell: false, ...opts });
    child.stdout?.on("data", (d) => (stdout += d.toString()));
    child.stderr?.on("data", (d) => (stderr += d.toString()));
    child.on("error", () => resolve({ ok: false, stdout, stderr, code: -1 }));
    child.on("close", (code) =>
      resolve({ ok: code === 0, stdout, stderr, code })
    );
  });

const getClaudeStatus = async () => {
  const which = await runCmd("bash", ["-lc", "command -v claude"]);
  if (!which.ok || !which.stdout.trim()) {
    return { installed: false, version: null, cliPath: null };
  }
  const cliPath = which.stdout.trim().split("\n").pop();
  const ver = await runCmd("bash", ["-lc", "claude --version"]);
  const version = ver.ok ? ver.stdout.trim() : null;
  return { installed: true, version, cliPath };
};

export { getClaudeStatus };
