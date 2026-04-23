const appLoaders = [
  () => import("./notebook/index.js"),
  () => import("./codex/index.js"),
  () => import("./claude-code/index.js")
];

export {
  appLoaders
};
