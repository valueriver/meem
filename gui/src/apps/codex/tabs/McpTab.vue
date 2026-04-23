<template>
  <div class="h-full overflow-y-auto cc-thin-scroll px-6 py-5 space-y-4">
    <div>
      <div class="text-[17px] font-bold">MCP Servers</div>
      <div class="text-[11.5px]" style="color:#6b5a46">数据来自 <span class="cc-mono">codex mcp list</span></div>
    </div>
    <div v-if="!data" class="text-[12px]" style="color:#8a7965">加载中...</div>
    <div v-else-if="!data.available" class="text-[12px]" style="color:#b03a20">{{ data.error || '-' }}</div>
    <div v-else-if="data.empty" class="rounded-xl text-center py-10" style="border:1px dashed rgba(140,100,60,0.25);background:rgba(255,255,255,0.4)">
      <div class="text-[40px] mb-2">🌐</div>
      <div class="text-[14px] font-bold mb-1">还没配置 MCP Server</div>
      <div class="text-[11.5px] max-w-md mx-auto" style="color:#6b5a46">用 codex mcp add 添加</div>
    </div>
    <div v-else class="space-y-2">
      <div v-for="m in data.configured" :key="m.name" class="cc-chart-card" style="padding:12px 16px">
        <div class="flex items-center gap-2">
          <span class="text-[13px] font-bold">{{ m.name }}</span>
          <span v-if="m.status" class="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
            :style="m.status === 'enabled' ? 'background:rgba(31,138,92,.12);color:#1f8a5c' : 'background:rgba(140,100,60,.1);color:#6b5a46'">{{ m.status }}</span>
          <span v-if="m.auth" class="text-[10px] px-1.5 py-0.5 rounded-full" style="background:rgba(140,100,60,.1);color:#6b5a46">{{ m.auth }}</span>
        </div>
        <div class="cc-mono text-[11px] mt-1 truncate" style="color:#6b5a46">{{ m.command }} {{ m.args }}</div>
        <div v-if="m.cwd" class="cc-mono text-[10px] mt-0.5 truncate" style="color:#8a7965">{{ 'cwd: {cwd}'.replace('{cwd}', m.cwd) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ data: { type: Object, default: null } });
</script>
