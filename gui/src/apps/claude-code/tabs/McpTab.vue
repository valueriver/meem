<template>
  <div class="h-full overflow-y-auto cc-thin-scroll px-6 py-5 space-y-4">
    <div>
      <div class="text-[17px] font-bold">MCP Servers</div>
      <div class="text-[11.5px]" style="color:#6b5a46">数据来自 <span class="cc-mono">claude mcp list</span></div>
    </div>
    <div v-if="!data" class="text-[12px]" style="color:#8a7965">加载中...</div>
    <div v-else-if="!data.available" class="text-[12px]" style="color:#b03a20">{{ data.error || '-' }}</div>
    <div v-else-if="data.empty" class="rounded-xl text-center py-10" style="border:1px dashed rgba(140,100,60,0.25);background:rgba(255,255,255,0.4)">
      <div class="text-[40px] mb-2">🌐</div>
      <div class="text-[14px] font-bold mb-1">还没接 MCP Server</div>
      <div class="text-[11.5px] max-w-md mx-auto" style="color:#6b5a46">MCP 让 Claude 能调外部能力 —— 浏览器 / 桌面 / 数据库 / 定时任务</div>
    </div>
    <div v-else class="space-y-2">
      <div v-for="m in data.configured" :key="m.name" class="cc-chart-card" style="padding:12px 16px">
        <div class="text-[13px] font-bold">{{ m.name }}</div>
        <div class="text-[11px] cc-mono mt-1" style="color:#6b5a46">{{ m.target }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ data: { type: Object, default: null } });
</script>
