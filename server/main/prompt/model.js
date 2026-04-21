const model = ({ provider, name, apiUrl }) => {
  return `

## 当前模型配置
- 供应方：${provider || "-"}
- 模型：${name || "-"}
- 请求地址：${apiUrl || "-"}`;
};
export {
  model
};
