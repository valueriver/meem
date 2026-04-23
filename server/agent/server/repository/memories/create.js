import { getDb } from "../db.js";

const VISIBILITY_VALUES = new Set(["hidden", "starred", "pinned"]);

const createMemory = ({
  title,
  description = "",
  content,
  creator = "user",
  visibility = "hidden",
  enabled = 1,
}) => {
  const v = VISIBILITY_VALUES.has(String(visibility))
    ? String(visibility)
    : "hidden";
  const row = getDb()
    .prepare(
      `INSERT INTO memories (title, description, content, creator, visibility, enabled)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING id`,
    )
    .get(
      String(title),
      String(description || ""),
      String(content),
      String(creator),
      v,
      enabled ? 1 : 0,
    );
  return row.id;
};

export { createMemory };
