---
name: notebook
description: Lightweight note app that supports create, edit, search, and AI optimization.
backend: server/apps/notebook
frontend: gui/src/apps/notebook
database: database/apps/notebook.db
---

# notebook

- Role: a lightweight note-taking and content organization app.
- Frontend: `gui/src/apps/notebook`
- Backend: `server/apps/notebook`
- Data: `database/apps/notebook.db`
- Entry points:
  - `GET /apps/notebook/list`
  - `POST /apps/notebook/create`
  - `POST /apps/notebook/update`
  - `POST /apps/notebook/delete`
  - `POST /apps/notebook/optimize`
