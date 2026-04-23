const tools = [
  {
    type: "function",
    function: {
      name: "terminal_exec",
      description: "在固定尺寸的 terminal 会话中执行一条命令，并等待结束。",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "要执行的终端命令。",
          },
          cwd: {
            type: "string",
            description: "命令工作目录。未提供时默认使用当前服务进程 cwd。",
          },
          timeoutSeconds: {
            type: "integer",
            description: "超时时间（秒）。默认 30 秒。",
          },
          env: {
            type: "object",
            description: "附加环境变量对象。键值都会按字符串处理。",
          },
          input: {
            type: "string",
            description: "启动后立即写入 terminal 的输入内容。",
          },
          maxOutputChars: {
            type: "integer",
            description: "输出截断上限，默认 20000。",
          },
        },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "terminal_start",
      description: "启动一个可持续读写的 terminal 会话。",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "要启动的终端命令。",
          },
          cwd: {
            type: "string",
            description: "命令工作目录。未提供时默认使用当前服务进程 cwd。",
          },
          timeoutSeconds: {
            type: "integer",
            description: "超时时间（秒）。设为 0 表示不自动超时。",
          },
          env: {
            type: "object",
            description: "附加环境变量对象。键值都会按字符串处理。",
          },
          input: {
            type: "string",
            description: "启动后立即写入 terminal 的输入内容。",
          },
        },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "terminal_read",
      description: "读取 terminal 会话的当前输出和状态。",
      parameters: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "terminal 会话 ID。",
          },
          maxOutputChars: {
            type: "integer",
            description: "输出截断上限，默认 20000。",
          },
        },
        required: ["sessionId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "terminal_write",
      description: "向 terminal 会话写入输入。",
      parameters: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "terminal 会话 ID。",
          },
          input: {
            type: "string",
            description: "要写入 terminal 的内容。",
          },
          closeStdin: {
            type: "boolean",
            description: "是否发送 EOT（Ctrl+D），用于通知程序输入结束。",
          },
          maxOutputChars: {
            type: "integer",
            description: "输出截断上限，默认 20000。",
          },
        },
        required: ["sessionId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "terminal_kill",
      description: "结束一个 terminal 会话并回收它。",
      parameters: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "terminal 会话 ID。",
          },
          signal: {
            type: "string",
            description: "发送的信号名，默认 SIGTERM。",
          },
          maxOutputChars: {
            type: "integer",
            description: "输出截断上限，默认 20000。",
          },
        },
        required: ["sessionId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "terminal_list",
      description: "列出当前所有 terminal 会话。",
      parameters: {
        type: "object",
        properties: {
          maxOutputChars: {
            type: "integer",
            description: "输出截断上限，默认 20000。",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_script",
      description:
        "一次性运行 Playwright 脚本:开新 Chromium、执行 code、关闭。适合单步抓取/查看网页。code 是 async 函数体,ctx 解构为 { page, browser, context },直接 return 结构化结果。",
      parameters: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description:
              "async function body。可用 page / browser / context。例: `await page.goto('https://example.com'); return { title: await page.title() };`",
          },
          headless: {
            type: "boolean",
            description: "是否无头,默认 true。调试或需要用户过目时传 false。",
          },
          timeoutSeconds: {
            type: "integer",
            description: "脚本超时秒数,默认 30。",
          },
        },
        required: ["code"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_open",
      description:
        "打开一个持久的 Chromium 会话,返回 sessionId。后续用 browser_exec / browser_screenshot 操作同一个 page(cookies/登录态共享)。不用时记得 browser_close。",
      parameters: {
        type: "object",
        properties: {
          headless: {
            type: "boolean",
            description: "是否无头,默认 true。需要用户手动登录/扫码时传 false。",
          },
          url: {
            type: "string",
            description: "可选,打开后立刻 goto 这个 URL。",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_exec",
      description:
        "在已有 browser 会话里运行 Playwright 脚本。可读 DOM、点击、填表、导航等,cookies 保留。一条 session 的多次 exec 串行执行。",
      parameters: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "browser session ID。",
          },
          code: {
            type: "string",
            description:
              "async function body。ctx 解构为 { page, browser, context }。return 的值会被 JSON 化后返给你。",
          },
          timeoutSeconds: {
            type: "integer",
            description: "脚本超时秒数,默认 30。",
          },
        },
        required: ["sessionId", "code"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_screenshot",
      description:
        "对 browser session 的当前页截图,落盘到 database/screenshots/。返回文件绝对路径。注意:你看不到图片内容,路径是给用户审查的;如要'读页面',请在 browser_exec 里用 innerText / innerHTML 抽文本。",
      parameters: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "browser session ID。",
          },
          selector: {
            type: "string",
            description: "CSS 选择器,只截该元素。省略则截整个可视区。",
          },
          fullPage: {
            type: "boolean",
            description: "是否截整页(长截图),默认 false。selector 存在时此项无效。",
          },
        },
        required: ["sessionId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_close",
      description: "关闭一个 browser 会话并释放 Chromium 进程。",
      parameters: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "browser session ID。",
          },
        },
        required: ["sessionId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_list",
      description: "列出所有活跃的 browser 会话。",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "screen_capture",
      description:
        "截取用户当前屏幕,保存到 database/screenshots/ 并返回文件路径。**你看不到图像内容**,此工具用于让用户看,或用其它视觉能力处理。macOS/Linux 可用。",
      parameters: {
        type: "object",
        properties: {
          mode: {
            type: "string",
            enum: ["screen", "selection"],
            description:
              "screen = 直接整屏截图(默认);selection = 弹出系统选区工具让用户手动框选一块区域(会打断用户,慎用,通常在用户要求'让我框一下'时才用)。",
          },
        },
      },
    },
  },
];

export { tools };
