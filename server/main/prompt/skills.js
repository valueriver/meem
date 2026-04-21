import { listSkills } from "../service/skills/list.js";
const skills = () => {
  const sections = listSkills().map((skill) => skill.content);
  if (sections.length === 0) return "";
  return `

## Skills
以下是可用技能的完整指令，直接按说明使用即可。

${sections.join("\n\n---\n\n")}`;
};
export {
  skills
};
