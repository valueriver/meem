#!/usr/bin/env node

import { execFileSync } from "child_process";

const ROAM_PORTS = [9507, 9508, 9509];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const portPids = (port) => {
  try {
    const out = execFileSync("lsof", ["-ti", `tcp:${port}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    return out
      .split(/\s+/)
      .map((item) => Number(item))
      .filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid);
  } catch {
    return [];
  }
};

const killPid = (pid, signal) => {
  try {
    process.kill(pid, signal);
    return true;
  } catch {
    return false;
  }
};

export const freeRoamPorts = async ({ quiet = false } = {}) => {
  const seen = new Set();
  const targets = [];

  for (const port of ROAM_PORTS) {
    for (const pid of portPids(port)) {
      if (seen.has(pid)) continue;
      seen.add(pid);
      targets.push(pid);
    }
  }

  if (!targets.length) return [];

  if (!quiet) {
    console.log(`[ports] freeing ROAM ports ${ROAM_PORTS.join(", ")}: killing ${targets.join(", ")}`);
  }

  for (const pid of targets) killPid(pid, "SIGTERM");
  await sleep(350);

  for (const pid of targets) {
    try {
      process.kill(pid, 0);
      killPid(pid, "SIGKILL");
    } catch {
      // already exited
    }
  }

  await sleep(150);
  return targets;
};

const command = process.argv[2];
if (command === "stop") {
  await freeRoamPorts();
} else if (command === "check") {
  let busy = false;
  for (const port of ROAM_PORTS) {
    const pids = portPids(port);
    if (pids.length) {
      busy = true;
      console.log(`${port}: ${pids.join(", ")}`);
    }
  }
  process.exit(busy ? 1 : 0);
} else if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Usage: node scripts/ports.mjs stop|check");
}
