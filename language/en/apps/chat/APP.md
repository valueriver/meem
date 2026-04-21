---
name: chat
description: Chat app with multi-session support, streaming replies, tool calls, and attachment upload.
backend: server/main/api/chat.js, server/main/chat, server/agent, server/llm, server/prompt
frontend: gui/src/apps/chat
database: database/aios.db (chats, messages)
---

# chat

- Role: the system's core chat app. It does not go through `server/apps/`; it is mounted directly on the main service.
- Frontend: `gui/src/apps/chat`
- Backend: `server/main/api/chat.js`, `server/main/chat/`, `server/agent/`, `server/llm/`, `server/prompt/`
- Data: `chats` and `messages` in `database/aios.db`
- Entry points:
  - HTTP: `/api/chat/*`
  - WebSocket: streaming chat session
  - Protocol: `gui/src/apps/chat/protocol.js`
- Attachments: `/api/files/upload`, stored under `files/uploads/chat`
