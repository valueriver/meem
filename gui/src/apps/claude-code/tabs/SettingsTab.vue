<template>
  <div class="h-full overflow-y-auto cc-thin-scroll px-6 py-5 space-y-4">
    <div class="flex items-start justify-between gap-4">
      <div>
        <div class="text-[17px] font-bold">Settings</div>
        <div class="text-[11.5px]" style="color:#6b5a46">来自 <span class="cc-mono">~/.claude/settings.json</span></div>
      </div>
      <div class="flex items-center gap-1">
        <template v-if="!editing">
          <button class="text-[11px] px-2.5 py-1 rounded-md border bg-white hover:bg-[#fdf7e8]"
            style="border-color:rgba(140,100,60,0.18);color:#4a3826"
            :disabled="!data || !data.available" @click="startEdit">✎ 编辑</button>
        </template>
        <template v-else>
          <span v-if="saveError" class="text-[10.5px] mr-1" style="color:#b03a20">{{ saveError }}</span>
          <button class="text-[11px] px-2.5 py-1 rounded-md hover:bg-black/5" style="color:#8a7965" :disabled="saving" @click="cancelEdit">取消</button>
          <button class="text-[11px] px-2.5 py-1 rounded-md cc-btn-primary font-semibold" :disabled="saving" @click="save">{{ saving ? '保存中...' : '保存' }}</button>
        </template>
      </div>
    </div>

    <div v-if="!data" class="text-[12px]" style="color:#8a7965">加载中...</div>
    <div v-else-if="!data.available" class="text-[12px]" style="color:#8a7965">settings.json 不存在</div>

    <div v-else class="cc-chart-card">
      <div class="cc-chart-title mb-1">JSON</div>
      <div v-if="editing" class="cc-chart-sub mb-2" style="color:#b97d1a">保存前会校验 JSON 结构 · 输错不会覆盖原文件</div>
      <textarea v-if="editing" v-model="draft"
        class="w-full cc-mono text-[11.5px] p-3 rounded-md outline-none"
        style="background:#1f1a12;color:#e8d8a8;border:1px solid rgba(140,100,60,0.18);min-height:320px;resize:vertical"
        :disabled="saving" spellcheck="false"></textarea>
      <pre v-else class="cc-mono text-[11.5px] p-3 rounded-md overflow-x-auto" style="background:#1f1a12;color:#e8d8a8">{{ JSON.stringify(data.settings, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({ data: { type: Object, default: null } });
const emit = defineEmits(['refresh']);

const editing = ref(false);
const draft = ref('');
const saving = ref(false);
const saveError = ref('');

const startEdit = () => {
  draft.value = JSON.stringify(props.data?.settings || {}, null, 2);
  saveError.value = '';
  editing.value = true;
};

const cancelEdit = () => {
  editing.value = false;
  saveError.value = '';
};

const save = async () => {
  saving.value = true;
  saveError.value = '';
  try {
    const resp = await fetch('/apps/claude-code/settings/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: draft.value })
    });
    const data = await resp.json();
    if (!data.ok) {
      saveError.value = data.error || '保存失败';
      return;
    }
    editing.value = false;
    emit('refresh');
  } catch (err) {
    saveError.value = err?.message || String(err);
  } finally {
    saving.value = false;
  }
};
</script>
