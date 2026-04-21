---
name: settings
description: System settings app responsible for models, tools, context, accounts, and language.
backend: server/main/api/settings.js, server/main/service/settings, server/main/repository/settings
frontend: gui/src/apps/settings
database: database/aios.db (settings)
---

# settings

- Role: a system-level settings app. It does not go through `server/apps/`; it is mounted directly on the main service.
- Frontend: `gui/src/apps/settings`
- Backend: `server/main/api/settings.js`, `server/main/service/settings/`, `server/main/repository/settings/`
- Data: `settings` in `database/aios.db`
- Entry points:
  - `GET /api/settings`
  - `GET /api/settings/skills`
  - `POST /api/settings`
