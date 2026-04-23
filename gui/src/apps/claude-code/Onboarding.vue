<template>
  <div class="h-full overflow-y-auto cc-thin-scroll">
    <div class="mx-auto max-w-[720px] px-8 py-12 space-y-8">
      <div>
        <div class="text-[40px] mb-3">🧠</div>
        <div class="text-[24px] font-bold">欢迎使用 Claude Code</div>
        <p class="mt-3 text-[13.5px] leading-[1.7]" style="color:#4a3826">
          Claude Code 是 Anthropic 出品的命令行 coding agent —— 在终端里跟 Claude 对话,让它直接读改你的项目代码。本应用是它在 AIOS 里的原生面板 · 聊天 · 项目 · 会话历史 · Skills / Agents / MCP / 插件管理一页看全。
        </p>
        <p class="mt-2 text-[12px]" style="color:#6b5a46">使用前需要先在本机安装 CLI。</p>
      </div>

      <div class="space-y-5">
        <div class="text-[13px] font-bold uppercase tracking-wider" style="color:#8a7965">在终端里跑一条命令就行</div>

        <div v-for="cmd in commands" :key="cmd.os" class="rounded-[14px] overflow-hidden" style="border:1px solid rgba(140,100,60,0.16);background:#fff">
          <div class="flex items-center justify-between px-4 py-2.5 border-b" style="border-color:rgba(140,100,60,0.10);background:#fdf7e8">
            <div class="flex items-center gap-2">
              <span class="text-[14px]">{{ cmd.icon }}</span>
              <span class="text-[12.5px] font-semibold" style="color:#2a1f13">{{ cmd.os }}</span>
            </div>
            <button class="text-[11px] px-2.5 py-1 rounded-md cc-btn-primary font-semibold" @click="copy(cmd)">
              {{ copied === cmd.os ? '已复制 ✓' : '复制' }}
            </button>
          </div>
          <pre class="cc-mono text-[11.5px] px-4 py-3 overflow-x-auto whitespace-pre" style="background:#1f1a12;color:#e8d8a8;margin:0">{{ cmd.cmd }}</pre>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button class="cc-btn-primary rounded-lg px-4 py-2 text-[13px] font-semibold" @click="$emit('recheck')">
          {{ checking ? '检测中...' : '装好了 · 重新检测' }}
        </button>
        <a href="https://docs.claude.com/en/docs/claude-code/overview" target="_blank" rel="noopener"
          class="text-[12px] underline" style="color:#5c4332">查看官方文档 ↗</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({ checking: { type: Boolean, default: false } });
defineEmits(['recheck']);

const commands = [
  {
    os: 'macOS / Linux / WSL',
    icon: '🍎',
    cmd: 'curl -fsSL https://claude.ai/install.sh | bash'
  },
  {
    os: 'Windows PowerShell',
    icon: '🪟',
    cmd: 'irm https://claude.ai/install.ps1 | iex'
  },
  {
    os: 'Windows CMD',
    icon: '🪟',
    cmd: 'curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd'
  }
];

const copied = ref(null);
let copiedTimer = null;

const copy = async (cmd) => {
  try {
    await navigator.clipboard.writeText(cmd.cmd);
    copied.value = cmd.os;
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => { copied.value = null; }, 1500);
  } catch {
    // Fallback: select + execCommand
    const ta = document.createElement('textarea');
    ta.value = cmd.cmd;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    copied.value = cmd.os;
    setTimeout(() => { copied.value = null; }, 1500);
  }
};
</script>
