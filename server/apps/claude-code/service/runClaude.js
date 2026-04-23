import { spawn } from "node:child_process";

const buildArgs = ({ sessionId, started, permissionMode }) => {
  const args = [
    "-p",
    "--output-format",
    "stream-json",
    "--input-format",
    "text",
    "--verbose"
  ];
  if (permissionMode) {
    args.push("--permission-mode", permissionMode);
  }
  if (started) {
    args.push("--resume", sessionId);
  } else {
    args.push("--session-id", sessionId);
  }
  return args;
};

const runClaude = ({
  sessionId,
  started,
  permissionMode,
  cwd,
  prompt,
  onEvent,
  onDone,
  onError
}) => {
  const args = buildArgs({ sessionId, started, permissionMode });
  const child = spawn("claude", args, {
    cwd,
    env: { ...process.env },
    shell: false
  });

  let stdoutBuf = "";
  let stderrBuf = "";
  let settled = false;

  const emitLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const parsed = JSON.parse(trimmed);
      onEvent?.(parsed);
    } catch {
      onEvent?.({ type: "raw", raw: trimmed });
    }
  };

  child.stdout.on("data", (chunk) => {
    stdoutBuf += chunk.toString("utf8");
    let idx;
    while ((idx = stdoutBuf.indexOf("\n")) !== -1) {
      const line = stdoutBuf.slice(0, idx);
      stdoutBuf = stdoutBuf.slice(idx + 1);
      emitLine(line);
    }
  });

  child.stderr.on("data", (chunk) => {
    stderrBuf += chunk.toString("utf8");
  });

  child.on("error", (err) => {
    if (settled) return;
    settled = true;
    onError?.(err);
  });

  child.on("close", (code) => {
    if (stdoutBuf.trim()) emitLine(stdoutBuf);
    if (settled) return;
    settled = true;
    if (code === 0) {
      onDone?.({ code, stderr: stderrBuf });
    } else {
      onError?.(new Error(stderrBuf || `claude exited with code ${code}`));
    }
  });

  child.stdin.write(prompt);
  child.stdin.end();

  return child;
};

export { runClaude };
