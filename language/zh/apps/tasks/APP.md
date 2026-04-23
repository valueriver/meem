---
name: tasks
description: 任务中心，负责创建、执行、停止和查看 AI 任务。
backend: server/main/api/task.js, server/main/task, server/main/agent, server/main/llm, server/main/prompt
frontend: gui/src/apps/tasks
database: database/aios.db (tasks, messages)
---

# tasks

- 定位：系统核心任务应用，不走 `server/apps/`，直接挂在主服务上。
- 前端：`gui/src/apps/tasks`
- 后端：`server/main/api/task.js`、`server/main/task/`、`server/main/agent/`、`server/main/llm/`、`server/main/prompt/`
- 数据：`database/aios.db` 中的 `tasks`、`messages`
- 入口：
  - `GET /api/task`
  - `GET /api/task/detail`
  - `GET /api/task/messages`
  - `POST /api/task/create/instant`
  - `POST /api/task/create/agent`
  - `POST /api/task/stop`
