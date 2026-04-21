export const tools = [
  {
    type: 'function',
    function: {
      name: 'shell',
      description: '执行 shell 命令，可以运行任意 shell 命令并返回输出结果',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: '要执行的 shell 命令'
          },
          reason: {
            type: 'string',
            description: '简要说明执行此命令的原因'
          },
          timeout: {
            type: 'number',
            description: '超时时间（秒），默认 30。服务端会裁剪到 [1, 300] 范围。对于耗时操作（安装依赖、构建、测试、抓网页等）应显式设置更大的值。'
          },
          cwd: {
            type: 'string',
            description: '可选工作目录，默认使用当前进程工作目录'
          }
        },
        required: ['command', 'reason']
      }
    }
  }
];