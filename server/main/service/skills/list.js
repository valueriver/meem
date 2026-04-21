import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { basename, join, relative } from "path";
import { homedir } from "os";
const PROJECT_SKILLS_ROOT = join(process.cwd(), "skills");
const SYSTEM_SKILLS_ROOT = join(homedir(), ".skills");
const parseFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { name: "", description: "" };
  const frontmatter = { name: "", description: "" };
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key === "name") frontmatter.name = value;
    if (key === "description") frontmatter.description = value;
  }
  return frontmatter;
};
const readSkillsFromRoot = (root, source) => {
  if (!existsSync(root)) return [];
  const skills = [];
  for (const dir of readdirSync(root)) {
    const skillDir = join(root, dir);
    if (!statSync(skillDir).isDirectory()) continue;
    const skillFile = join(skillDir, "SKILL.md");
    if (!existsSync(skillFile)) continue;
    const content = readFileSync(skillFile, "utf8").trim();
    if (!content) continue;
    const frontmatter = parseFrontmatter(content);
    skills.push({
      id: `${source}:${dir}`,
      name: frontmatter.name || basename(skillDir),
      description: frontmatter.description || "",
      path: source === "project" ? relative(process.cwd(), skillFile) : skillFile,
      source,
      content
    });
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
};
const listSkills = () => {
  return [
    ...readSkillsFromRoot(PROJECT_SKILLS_ROOT, "project"),
    ...readSkillsFromRoot(SYSTEM_SKILLS_ROOT, "system")
  ];
};
export {
  listSkills
};
