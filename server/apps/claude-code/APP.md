---
name: claude-code
description: Claude Code 应用 - 把本地 claude CLI 包成 AIOS 对话式 app。
backend: server/apps/claude-code
frontend: gui/src/apps/claude-code
database: database/apps/claude-code.db
---

# Claude Code（claude-code）

把本地安装的 `claude` CLI 包成 AIOS 应用，每个会话对应一个独立 workspace 目录，用原生聊天 UI 承载。

## API
- `GET /apps/claude-code/status` — 检测 CLI 安装与版本
- `GET /apps/claude-code/conversations` — 会话列表
- `POST /apps/claude-code/conversations/create` — 新建会话，自动分配 workspace
- `POST /apps/claude-code/conversations/rename` — 重命名
- `POST /apps/claude-code/conversations/delete` — 删除
- `GET /apps/claude-code/messages?conversationId=` — 消息历史
- `POST /apps/claude-code/send` — 发送消息，返回 `application/x-ndjson` 流（每行一个事件）

## 流式协议
每行 JSON：`{ "type": "event", "payload": <claude-stream-json-event> }` / `{ "type": "done" }` / `{ "type": "error", "message": "..." }`

## 数据表
- `cc_conversations(id, name, session_id, cwd, started, created_at, updated_at)`
- `cc_messages(id, conversation_id, role, content, meta_json, created_at)`

## 子进程调用
`claude -p --output-format stream-json --verbose --permission-mode acceptEdits [--session-id|--resume <uuid>]`，prompt 从 stdin 喂入，cwd 指向会话 workspace。

## 已知限制（MVP）
- 权限模式固定 `acceptEdits`，未接 AIOS 原生审批 UI
- 未处理 hook、MCP、subagent 等高级能力
- 未做跨 AIOS 重启的进程恢复（send 期间重启会丢失）
