const parseJsonObject = (raw = "") => {
  const text = String(raw || "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced ? fenced[1] : text;
  const matched = source.match(/\{[\s\S]*\}/);
  if (!matched) throw new Error("AI 返回不是 JSON");
  return JSON.parse(matched[0]);
};
const validateBySchema = (value, schema) => {
  if (!schema || typeof schema !== "object") return true;
  const required = Array.isArray(schema.required) ? schema.required : [];
  for (const key of required) {
    if (!(key in value)) {
      throw new Error(`结构化结果缺少字段: ${key}`);
    }
  }
  return true;
};
export {
  parseJsonObject,
  validateBySchema
};
