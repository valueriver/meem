---
name: tasks
description: Task center responsible for creating, executing, stopping, and viewing AI tasks.
backend: server/main/api/task.js, server/main/task, server/main/agent, server/main/llm, server/main/prompt
frontend: gui/src/apps/tasks
database: database/aios.db (tasks, messages)
---

# tasks

- Role: the system's core task app. It does not go through `server/apps/`; it is mounted directly on the main service.
- Frontend: `gui/src/apps/tasks`
- Backend: `server/main/api/task.js`, `server/main/task/`, `server/main/agent/`, `server/main/llm/`, `server/main/prompt/`
- Data: `tasks` and `messages` in `database/aios.db`
- Entry points:
  - `GET /api/task`
  - `GET /api/task/detail`
  - `GET /api/task/messages`
  - `POST /api/task/create/instant`
  - `POST /api/task/create/agent`
  - `POST /api/task/stop`
