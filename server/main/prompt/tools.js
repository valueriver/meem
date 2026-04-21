const tools = ({
  enableToolResultTruncate,
  toolResultMaxChars,
  enableToolLoopLimit,
  toolMaxRounds
}) => {
  return `

## 工具配置
- 工具结果截断：${enableToolResultTruncate ? "开启" : "关闭"}
- 工具结果最大长度：${toolResultMaxChars ?? "-"}
- 工具循环限制：${enableToolLoopLimit ? "开启" : "关闭"}
- 工具最大循环轮次：${toolMaxRounds ?? "-"}`;
};
export {
  tools
};
