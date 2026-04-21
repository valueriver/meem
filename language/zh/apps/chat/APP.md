---
name: chat
description: 对话应用，多会话、流式回复、工具调用、附件上传。
backend: server/main/api/chat.js, server/main/chat, server/agent, server/llm, server/prompt
frontend: gui/src/apps/chat
database: database/aios.db (chats, messages)
---

# chat

- 定位：系统核心对话应用，不走 `server/apps/`，直接挂在主服务上。
- 前端：`gui/src/apps/chat`
- 后端：`server/main/api/chat.js`、`server/main/chat/`、`server/agent/`、`server/llm/`、`server/prompt/`
- 数据：`database/aios.db` 中的 `chats`、`messages`
- 入口：
  - HTTP：`/api/chat/*`
  - WebSocket：聊天流式会话
  - 协议：`gui/src/apps/chat/protocol.js`
- 附件：`/api/files/upload`，文件落到 `files/uploads/chat`
