#!/usr/bin/env node

import http from "http";
import { createApiHandler } from "./api/index.js";

let serverInstance = null;

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(`${JSON.stringify(payload, null, 2)}\n`);
};

const openSse = (res) => {
  if (res.writableEnded || res.destroyed) return;
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  });
};

const sendSse = (res, event, payload) => {
  if (res.writableEnded || res.destroyed) return;
  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  } catch {
    // 连接已关闭(客户端 abort),静默丢弃
  }
};

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
};

const handleRequest = createApiHandler({
  openSse,
  readBody,
  sendJson,
  sendSse,
});

const startServer = async (port = 9500) => {
  return new Promise((resolve, reject) => {
    serverInstance = http.createServer(async (req, res) => {
      try {
        await handleRequest(req, res, port);
      } catch (error) {
        sendJson(res, 500, { ok: false, error: error.message });
      }
    });

    serverInstance.listen(port, "127.0.0.1", () => {
      console.log(`AGENT server running on http://127.0.0.1:${port}`);
      resolve(serverInstance);
    });

    serverInstance.on("error", reject);
  });
};

const stopServer = async () => {
  if (serverInstance) {
    return new Promise((resolve) => {
      serverInstance.close(() => resolve());
    });
  }
};

// 如果直接运行此文件，启动服务器
if (process.argv[1] && process.argv[1].includes("server/index.js")) {
  const port = Number(process.env.AGENT_PORT) || 9500;
  startServer(port).catch(console.error);
}

export { startServer, stopServer };
