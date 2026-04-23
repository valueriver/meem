<template>
  <div class="h-full overflow-y-auto cc-thin-scroll px-6 py-5 space-y-4">
    <div>
      <div class="text-[17px] font-bold">Skills</div>
      <div class="text-[11.5px]" style="color:#6b5a46">扫自 <span class="cc-mono">~/.codex/skills</span></div>
    </div>
    <div v-if="!data" class="text-[12px]" style="color:#8a7965">加载中...</div>
    <div v-else class="grid grid-cols-2 gap-4">
      <div>
        <div class="text-[11px] font-bold uppercase tracking-wider mb-2" style="color:#8a7965">{{ '用户 ({n})'.replace('{n}', String(data.user.length)) }}</div>
        <div class="space-y-2">
          <div v-for="s in data.user" :key="s.path" class="cc-card">
            <div class="flex items-start gap-3">
              <div class="cc-icon">✨</div>
              <div class="min-w-0 flex-1">
                <div class="text-[12.5px] font-bold cc-mono">{{ s.name }}</div>
                <div class="text-[11px] mt-0.5" style="color:#6b5a46">{{ s.description || '(no description)' }}</div>
              </div>
            </div>
          </div>
          <div v-if="!data.user.length" class="text-[11.5px]" style="color:#8a7965">(无)</div>
        </div>
      </div>
      <div>
        <div class="text-[11px] font-bold uppercase tracking-wider mb-2" style="color:#8a7965">{{ '系统 ({n})'.replace('{n}', String(data.system.length)) }}</div>
        <div class="space-y-2">
          <div v-for="s in data.system" :key="s.path" class="cc-card">
            <div class="flex items-start gap-3">
              <div class="cc-icon">⚙️</div>
              <div class="min-w-0 flex-1">
                <div class="text-[12.5px] font-bold cc-mono">{{ s.name }}</div>
                <div class="text-[11px] mt-0.5" style="color:#6b5a46">{{ s.description || '(no description)' }}</div>
              </div>
            </div>
          </div>
          <div v-if="!data.system.length" class="text-[11.5px]" style="color:#8a7965">(无)</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ data: { type: Object, default: null } });
</script>
