import { db } from "./client.js";

const NOTEBOOK_SEEDS = [
  "随心记\n\n想到什么就写，不用在意格式。\n右侧 ✦ 可以让 AI 帮你润色，置顶把重要的钉在最上面。\n\n你写在这里的东西，AIOS 也能看到。\n聊天时它了解你在想什么、关注什么，\n给你的回应会更贴合你自己。",
  "碎片也值得被留下\n\n灵感不会等你准备好。\n一个词、半句话、还没想清楚的念头——\n先扔进来，不要管它够不够完整。\n\n有时候几周后再看，\n才发现当时随手写的那句话，\n正好是你现在需要的答案。",
  "值得慢慢想的事\n\n什么样的一天，结束时不觉得空？\n什么事情，是只有自己才能做的？\n什么时候，感觉最像自己？\n\n不用现在回答。\n写下来，留着。"
];

const initNotebookTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL DEFAULT '',
      style INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
};

const seedNotebookIfEmpty = () => {
  const count = db.prepare("SELECT COUNT(*) as c FROM notes").get().c;
  if (count !== 0) return;
  const insert = db.prepare(`
    INSERT INTO notes (content, style, created_at, updated_at)
    VALUES (?, ?, datetime('now'), datetime('now'))
  `);
  for (const content of NOTEBOOK_SEEDS) {
    insert.run(content, Math.floor(Math.random() * 8));
  }
};

const initNotebookDatabase = () => {
  initNotebookTables();
  seedNotebookIfEmpty();
};

export {
  initNotebookDatabase
};
