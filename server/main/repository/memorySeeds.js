const zhAppCreationGuide = `# 应用开发指导

这是 AIOS 新建和修改应用的数据库内置系统记忆版本。

## 基本原则

- 应用后端代码放在 \`server/apps/<appname>/\`
- 应用前端代码放在 \`gui/src/apps/<appname>/\`
- 应用说明文档放在 \`language/<lang>/apps/<appname>/APP.md\`
- 不要把应用服务代码写到顶层 \`apps/\` 目录

## 后端约定

- 每个应用至少包含 \`index.js\`、\`api/index.js\`、\`service/\`、\`repository/\`
- \`index.js\` 默认导出对象，包含 \`name\`、\`match\`、\`handleApi\`
- 新应用必须注册到 \`server/apps/registry.js\`
- 改完 \`server/apps/\` 下代码后，需要触发 reload 才会生效

## API 约定

- 应用 API 统一走 \`/apps/<appname>/<action>\`
- 查询类接口用 \`GET\`
- 变更类接口用 \`POST + JSON body\`
- 读取 body 使用 \`readBody(req)\`
- 返回 JSON 使用 \`json(res, data, status?)\`
- 未命中路径时返回 \`false\`

## 数据库约定

- 应用数据库通过 \`createAppDb()\` 创建
- 建表放在 \`repository/init.js\`
- SQL 操作拆到各自的 \`repository/<action>.js\`
- 不做兼容旧结构的迁移逻辑；需要改表时，直接按当前最终结构重建

## 前端约定

- 应用界面放在 \`gui/src/apps/<appname>/\`
- 参考现有应用的结构，不要照搬 Express、Electron 或随意自造接口风格
- 改了 \`gui/\` 下代码后，reload 时要带上 \`build: true\`

## 重载约定

- 改 \`server/apps/\`：\`restartApps: true\`
- 改 \`server/main/\`、\`server/shared/\`、\`server/agent/\`、\`server/llm/\`、\`server/prompt/\`：\`restartServer: true\`
- 改 \`gui/\`：\`build: true\`

## 补充

- 系统级应用 \`chat\`、\`settings\`、\`tasks\` 是特例，不在 \`server/apps/\`
- 长期行为变更优先落到代码，不做只靠临时命令的补丁
`;

const enAppCreationGuide = `# App Creation Guide

This is the database-backed built-in system memory for creating and modifying AIOS apps.

## Core Rules

- App backend code lives in \`server/apps/<appname>/\`
- App frontend code lives in \`gui/src/apps/<appname>/\`
- App docs live in \`language/<lang>/apps/<appname>/APP.md\`
- Do not write app service code into the top-level \`apps/\` directory

## Backend Rules

- Each app should at least include \`index.js\`, \`api/index.js\`, \`service/\`, and \`repository/\`
- \`index.js\` should default-export an object with \`name\`, \`match\`, and \`handleApi\`
- New apps must be registered in \`server/apps/registry.js\`
- Changes under \`server/apps/\` require reload before they take effect

## API Rules

- App APIs use \`/apps/<appname>/<action>\`
- Read endpoints use \`GET\`
- Write endpoints use \`POST + JSON body\`
- Read request bodies with \`readBody(req)\`
- Return JSON with \`json(res, data, status?)\`
- Return \`false\` for unmatched paths

## Database Rules

- Use \`createAppDb()\` for app databases
- Create tables in \`repository/init.js\`
- Keep SQL operations in dedicated \`repository/<action>.js\` files
- Do not keep migration branches for old schemas; rebuild to the current final shape when schema changes

## Frontend Rules

- App UI lives in \`gui/src/apps/<appname>/\`
- Follow existing app structure instead of inventing a different web stack style
- If you change files under \`gui/\`, reload must include \`build: true\`

## Reload Rules

- Change \`server/apps/\`: \`restartApps: true\`
- Change \`server/main/\`, \`server/shared/\`, \`server/agent/\`, \`server/llm/\`, \`server/prompt/\`: \`restartServer: true\`
- Change \`gui/\`: \`build: true\`

## Notes

- System apps \`chat\`, \`settings\`, and \`tasks\` are special cases and do not live under \`server/apps/\`
- Persistent behavior changes should go into code, not temporary shell-only patches
`;

const getSystemMemorySeeds = (locale = "zh") => {
  if (locale === "en") {
    return [
      {
        title: "App Creation Guide",
        description: "Core AIOS app structure, API rules, database patterns, frontend placement, and reload workflow",
        content: enAppCreationGuide,
        creator: "system",
        pinned: 0,
        enabled: 1
      }
    ];
  }
  return [
    {
      title: "应用开发指导",
      description: "AIOS 应用结构、API 规则、数据库写法、前端放置与 reload 约定",
      content: zhAppCreationGuide,
      creator: "system",
      pinned: 0,
      enabled: 1
    }
  ];
};

export { getSystemMemorySeeds };
