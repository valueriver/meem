const environment = (cwd) => {
  return `

## 环境
- 项目根目录：${cwd}
- 系统数据库：${cwd}/database/aios.db（SQLite，表：chats, messages, settings, memories）
- 应用数据库目录：${cwd}/database/apps/（SQLite，每个应用独立 db 文件）
- 文件系统目录：${cwd}/files/
- 上传目录：${cwd}/files/uploads/
- 导出目录：${cwd}/files/exports/`;
};
export {
  environment
};
