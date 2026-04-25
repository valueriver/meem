<div align="center">

```
      .                ·               .
                          _
                        _/ \_
              _       _/     \_
            _/ \_    /         \_
          _/     \__/             \___
        _/                             \__
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

# Roam · 漫游

**忘掉 SSH。忘掉 VPN。忘掉端口转发。**

一个 Cloudflare Worker 做中继，WebSocket 做管道。
你家里的 shell、文件、浏览器、Agent —— 在任何设备的浏览器里随手可得。

`零端口 · 零 IP 暴露 · 只做远程`

</div>

---

## 它能干什么

| | |
|--|--|
| 🖥️ | **完整终端** — 多标签页、xterm 全功能、触屏友好，远程连上就像坐在自己电脑前 |
| 📂 | **文件管理** — 列表、预览（文本 + 图片）、上传、下载、重命名、搜索、排序 |
| 🤖 | **Agent 模块** — 装一个 OpenAI 兼容模型就能用，支持 `terminal_exec` / `fs_list` / `fs_read` / `browser_run_code` 工具，持久多会话，历史分页 |
| 🌐 | **浏览器操控** — agent 可以开本机 Chrome，跑 Playwright 代码 |
| 🔐 | **认证硬核** — 密码 HMAC-SHA256 挑战响应不出浏览器、30 天免登录 token、10 次失败全局锁 30 分钟、单设备独占（新登录自动顶替旧） |
| 💾 | **全量持久化** — SQLite 落盘在 `~/.roam/roam.db`，模型配置 / 会话 / 消息都在，重启不丢 |
| 🚀 | **链接即会话** — 桌面端打印一条 URL，手机、iPad、公司电脑 —— 任何浏览器打开都是你本机 |

---

## 架构

```
 ┌──────────┐   WSS    ┌──────────────────────────┐   WSS   ┌──────────┐
 │ 浏览器    │────────▶│ Cloudflare Worker         │◀────────│ 桌面端    │
 │  Vue 3    │         │  · DO + Hibernation       │         │  Node    │
 │  Tailwind │         │  · 设备管理 + 纯转发        │         │  SQLite  │
 │  xterm    │◀────────│  · 单设备独占 / 锁定        │────────▶│  node-pty│
 └──────────┘          └──────────────────────────┘          │ Playwright│
                                                              └──────────┘
```

浏览器和桌面端都**主动拨**到 Worker，Worker 按 sessionId 配对。Worker 自身几乎无状态（只存 `requiresPassword` 标志），真正的一切 —— 认证、会话、消息 —— 都在桌面端的本地 SQLite 里。

---

## 快速开始

### 1. 部署 Worker

```bash
cd worker
npm install
npx wrangler deploy
```

输出里会给你 `https://roam.<你的子域>.workers.dev`。

### 2. 桌面端

```bash
cd desktop
cp .env.example .env
# 编辑 .env：
#   ROAM_URL=https://roam.<你的子域>.workers.dev
#   SESSION_PASSWORD=自己定一个（可选，不填就免密）
npm install
npm start
```

控制台会打印：

```
🔗 访问链接:
   https://roam.<你的子域>.workers.dev/guard?session=<uuid>
🔐 访问密码: <你设的>
```

任何浏览器打开这个链接，输密码进去就是你本机。

### 3. 配 Agent 模型（首次）

第一次打开 `/agent` 标签页，空态下有个表单 —— 填入 OpenAI 兼容接口的 `API URL` / `API Key` / `Model`，保存即可。

写入的是桌面端 `~/.roam/roam.db` 的 `settings` 表，下次启动还在。

---

## 技术栈

| 层 | 栈 |
|--|--|
| Worker | Cloudflare Workers · Durable Objects · WebSocket Hibernation |
| 前端 | Vue 3.5 · vue-router · Pinia · Vite 6 · Tailwind v4 · xterm · marked |
| 桌面端 | Node.js · better-sqlite3 · node-pty · ws · playwright |

---

## 目录结构

按 feature 划分，每个目录自闭合（`index.js` 导出 `handle(msg)`、`core/` 存模块级状态、`commands/` 存动作）：

```
desktop/
├── index.js              10 行入口
├── app.js                组装 guard / terminal / files / agent
├── db.js                 SQLite（~/.roam/roam.db）
├── core/                 env / ids / mime / ws / router
├── guard/                认证：challenge / submit / nonces / lockout
├── terminal/             用户端 pty
├── files/                fs.* 消息族
└── agent/                Agent 本体
    ├── handler.js        对话循环
    ├── runner.js         工具执行
    ├── functions.js      工具名 → 实现
    ├── tools.js          工具 schema
    ├── core/             config / session / llm
    ├── terminal/         agent tool：shell exec
    └── browser/          agent tool：Playwright run_code
```

```
worker/src/
├── views/                TerminalView / FilesView / AgentView / GuardView
├── components/
│   ├── agent/            AgentToolChip · AgentConfigForm
│   ├── terminal/         TerminalToolbar / InputBar / BottomPanel ...
│   └── files/            FilesToolbar / FileList / PreviewModal ...
├── stores/               ws / agent / terminal / files / settings / ...
└── router.js             /guard / /terminal / /files / /agent
```

---

## 数据库

```sql
-- 键值配置：agent.apiUrl / agent.apiKey / agent.model / agent.activeSessionId / ...
CREATE TABLE settings (
    key TEXT PRIMARY KEY, value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 多会话
CREATE TABLE sessions (
    id TEXT PRIMARY KEY, title TEXT NOT NULL DEFAULT '新会话',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 消息：message 字段直接存 OpenAI 格式的 JSON
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
    message TEXT NOT NULL,       -- {"role":"user","content":"..."}
                                 -- {"role":"assistant","tool_calls":[...]}
                                 -- {"role":"tool","tool_call_id":"...","content":"..."}
    meta TEXT,                   -- 预留扩展（UI flag 等）
    created_at TEXT DEFAULT (datetime('now'))
);
```

消息持久化策略是 **db 原样存 LLM 消息**：回放给 LLM 时零转换，推给前端时 UI 自己 parse。

---

## 认证机制

| 层 | 内容 |
|--|--|
| 密码 | HMAC-SHA256 challenge/response —— 密码原文**不出浏览器**，浏览器用密码签桌面端发的 nonce，后端 `timingSafeEqual` 比对 |
| 免登录 | 成功后后端颁发 30 天 token，存 localStorage，下次 WS 连接带 `?authToken=X` 自动放行 |
| 暴力防护 | 累计 10 次失败 → desktop 触发全局锁 30 分钟，期间所有连接被拒 + 清空全部 token |
| 单设备独占 | 新设备认证通过 → worker 主动 `ws.close(4001)` 所有其它已认证的 web，前端弹"已在另一台设备登录" |

进门后的所有消息是明文 over WSS —— TLS 加密到 Cloudflare 边缘，再 TLS 加密到你桌面端。CF 内部理论可见，可信度取决于你信不信 Cloudflare。

---

## 本地开发

```bash
# 一号终端：Worker (WSS 中继 + SPA 静态服务)
cd worker && npm run dev                 # :8787

# 二号终端：桌面端
cd desktop && ROAM_URL=http://localhost:8787 npm start

# 三号终端（可选）：Vite HMR 前端开发
cd worker && npm run dev:web             # :5173
```

---

## 成本

Cloudflare Workers 付费计划 **$5 / 月**。因为用了 Hibernation API，DO 挂着 WebSocket 时不计 duration 费 —— 日常几乎全在免费额度里。

---

## License

[MIT](./LICENSE)
