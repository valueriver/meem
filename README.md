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

**把家里电脑变成你的云开发机。**

Agent · Shell · Files — 在浏览器里随手可得。

</div>

---

## 🚨 老版本用户请看

> **Roam v2 (Cloudflare Worker 版) 已归档为 [`ROAM-v2.zip`](./ROAM-v2.zip)**
>
> 这个仓库的 `main` 分支现在是全新的 v4 架构。如果你之前在用 v2 —— 桌面端和浏览器都通过 Cloudflare Worker + Durable Object 做中继的版本,
> **继续使用 v2 的方法**:
>
> 1. 从本仓库根目录下载 [`ROAM-v2.zip`](./ROAM-v2.zip)
> 2. 解压,按包内 README 配置 Cloudflare Worker
> 3. 或 `git checkout v2` 切到历史标签
>
> v4 不再依赖 Cloudflare。公网穿透自己挑工具 (ngrok / Cloudflare Tunnel / Tailscale / 局域网裸跑),Roam 只负责家里电脑这一头。

---

## v4 是什么

v4 保留 v2 的三块核心功能 (Agent / Shell / Files),底层架构换到 AIOS 的双进程模型:

- **`main` 进程** (端口 9506) — 稳定内核:HTTP + WebSocket、agent、LLM 流式、pty 终端、文件 API
- **`apps` 进程** (端口 9507) — 应用运行时,支持热重启 (为将来 AI 生成应用预留)
- 前端 Vue 3 + Pinia + Tailwind v4,Linear 风格冷中性色,支持明暗双主题

### 三个核心 app

| | |
|--|--|
| 💬 **Agent** | 对话式 AI 助手,工具可操作终端 / 文件;支持持久会话、工具调用、多模型切换 |
| 🖥 **Shell**  | xterm 多标签终端,触屏键盘,直连本机 pty |
| 📂 **Files** | 浏览任意目录、预览、上传、下载、重命名、搜索、排序 |

---

## 启动

要求:Node.js 20+,macOS / Linux (Windows 理论可但未测)。

```bash
git clone https://github.com/valueriver/roam.git
cd roam
npm install          # 会自动 chmod node-pty 的 spawn-helper
npm run build        # 构建前端到 gui/dist
npm start            # 起 main + apps 两个进程
```

打开 <http://localhost:9506>。

- `npm run start:main` — 只起内核进程
- `npm run start:apps` — 只起应用进程
- `npm run dev` — main + apps + vite dev server

---

## 暴露到公网(可选)

v4 默认只绑 `127.0.0.1`。想远程用,挑一个隧道:

### ngrok(最省事)
```bash
ngrok http 9506
```

### Cloudflare Tunnel(长期域名)
```bash
brew install cloudflared
cloudflared tunnel create roam
cloudflared tunnel route dns roam roam.你的域.com
cloudflared tunnel --url http://localhost:9506 run roam
```
配合 Cloudflare Zero Trust Access 锁定访问。

### Tailscale Serve
```bash
tailscale serve --bg 9506
```
只有 tailnet 成员可访问。

---

## 目录结构

```
roam-v4/
├── server/
│   ├── main/                 # 稳定内核
│   │   ├── agent/            # 对话循环 + 工具编排
│   │   ├── llm/              # OpenAI 兼容流式客户端
│   │   ├── prompt/           # 系统提示词组装
│   │   ├── chat/             # 会话持久化
│   │   ├── terminal/         # pty + WS (/ws/terminals)
│   │   ├── api/              # REST 路由分发
│   │   ├── service/          # auth / settings / files / system
│   │   ├── task/             # 后台 AI 任务管理
│   │   ├── repository/       # SQLite 读写
│   │   └── system/           # http / ws / 目录初始化
│   ├── apps/                 # 应用进程 (目前空 registry,框架预留)
│   │   ├── index.js
│   │   ├── registry.js
│   │   └── app_shared/
│   └── shared/               # main + apps 共用
├── gui/
│   └── src/
│       ├── apps/
│       │   ├── chat/         # Agent UI
│       │   ├── shell/        # 终端 UI
│       │   ├── files/        # 文件 UI
│       │   └── settings/     # 模型配置
│       ├── components/       # AppHeader / AppDrawer / ConnectionGate / ToastHost / TaskIndicator / TaskPanel
│       ├── stores/           # ws / theme / view / tasks / agent / files / terminal / snippets ...
│       ├── utils/
│       └── views/            # DesktopView (壳) + GuardView
├── scripts/
│   ├── start.mjs             # i18n 烘焙 (prestart hook)
│   ├── run.mjs               # 一键启动两进程
│   └── fix-node-pty.js       # postinstall: chmod spawn-helper
└── language/                 # zh/en 文案
```

---

## 和 v2 的差异

| | v2 | v4 |
|--|--|--|
| 部署模型 | 桌面和浏览器都拨 Cloudflare Worker + DO 做中继 | 桌面端本地 HTTP/WS,公网穿透自带工具 |
| 依赖 | 需要 CF 账号、`wrangler deploy`、Workers 付费计划 | 零外部依赖,全本地 |
| 后端架构 | 单进程 | 双进程 (main + apps),为 AI 生成应用预留 |
| 前端 | Vue 3 + Pinia | 同上,换 Linear 风格设计系统,支持明暗主题 |
| 认证 | Cloudflare Access / 密码门 | 本地默认无认证 (localhost 够用),公网穿透时建议套 CF Access / Tailscale |

---

## License

MIT
