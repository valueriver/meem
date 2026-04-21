---
name: settings
description: 系统设置应用，负责模型、工具、上下文、账户和语言。
backend: server/main/api/settings.js, server/main/service/settings, server/main/repository/settings
frontend: gui/src/apps/settings
database: database/aios.db (settings)
---

# settings

- 定位：系统级设置应用，不走 `server/apps/`，直接挂在主服务上。
- 前端：`gui/src/apps/settings`
- 后端：`server/main/api/settings.js`、`server/main/service/settings/`、`server/main/repository/settings/`
- 数据：`database/aios.db` 中的 `settings`
- 入口：
  - `GET /api/settings`
  - `GET /api/settings/skills`
  - `POST /api/settings`
