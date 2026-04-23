import { db } from "./client.js";

const SYSTEM_MEMORY_SEEDS = [
  {
    title: "应用开发指导",
    description: "AIOS 应用结构、API 规则、数据库写法、前端放置与 reload 约定",
    content: "# 应用开发指导\n\n这是 AIOS 新建和修改应用的数据库内置系统记忆版本。\n\n## 基本原则\n\n- 应用后端代码放在 `server/apps/<appname>/`\n- 应用前端代码放在 `gui/src/apps/<appname>/`\n- 应用说明文档放在 `language/<lang>/apps/<appname>/APP.md`\n- 不要把应用服务代码写到顶层 `apps/` 目录\n\n## 后端约定\n\n- 每个应用至少包含 `index.js`、`api/index.js`、`service/`、`repository/`\n- `index.js` 默认导出对象，包含 `name`、`match`、`handleApi`\n- 新应用必须注册到 `server/apps/registry.js`\n- 改完 `server/apps/` 下代码后，需要触发 reload 才会生效\n\n## API 约定\n\n- 应用 API 统一走 `/apps/<appname>/<action>`\n- 查询类接口用 `GET`\n- 变更类接口用 `POST + JSON body`\n- 读取 body 使用 `readBody(req)`\n- 返回 JSON 使用 `json(res, data, status?)`\n- 未命中路径时返回 `false`\n\n## 数据库约定\n\n- 应用数据库通过 `createAppDb()` 创建\n- 建表放在 `repository/init.js`\n- SQL 操作拆到各自的 `repository/<action>.js`\n- 不做兼容旧结构的迁移逻辑；需要改表时，直接按当前最终结构重建\n\n## 前端约定\n\n- 应用界面放在 `gui/src/apps/<appname>/`\n- 参考现有应用的结构，不要照搬 Express、Electron 或随意自造接口风格\n- 改了 `gui/` 下代码后，reload 时要带上 `build: true`\n\n## 重载约定\n\n- 改 `server/apps/`：`restartApps: true`\n- 改 `server/main/`：`restartServer: true`\n- 改 `gui/`：`build: true`\n\n## 补充\n\n- 系统级应用 `chat`、`settings`、`tasks` 是特例，不在 `server/apps/`\n- 长期行为变更优先落到代码，不做只靠临时命令的补丁",
    creator: "system",
    pinned: 0,
    enabled: 1
  }
];

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      title TEXT,
      description TEXT DEFAULT '',
      scene TEXT NOT NULL DEFAULT 'chat',
      meta TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      message TEXT NOT NULL,
      meta TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT,
      app TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      mode TEXT NOT NULL DEFAULT 'agent',
      prompt TEXT NOT NULL,
      schema TEXT,
      meta TEXT,
      response TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      error TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      finished_at TEXT
    );

    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      creator TEXT NOT NULL DEFAULT 'user',
      pinned INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
};

const seedMemoriesIfEmpty = () => {
  const count = db.prepare("SELECT COUNT(*) as c FROM memories").get().c;
  if (count !== 0) return;
  try {
    for (const item of SYSTEM_MEMORY_SEEDS) {
      db.prepare(
        "INSERT INTO memories (title, description, content, creator, pinned, enabled) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(
        item.title,
        item.description,
        item.content,
        item.creator || "system",
        item.pinned ? 1 : 0,
        item.enabled === 0 ? 0 : 1
      );
    }
  } catch (error) {
    console.error("[memory-seeds] failed to seed system memories:", error);
  }
};

const initDatabase = () => {
  createTables();
  seedMemoriesIfEmpty();
};

export {
  initDatabase
};
