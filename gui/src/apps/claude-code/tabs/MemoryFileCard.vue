<template>
  <div class="cc-chart-card" :style="compact ? 'padding:12px 14px' : ''">
    <div class="flex items-center gap-2">
      <span class="text-[14px]">🧠</span>
      <span class="text-[13px] font-bold cc-mono">{{ file.name }}</span>
      <span class="text-[10.5px]" style="color:#8a7965">{{ formatNum(file.size) }}B · {{ formatDate(file.modified) }}</span>
      <div class="ml-auto flex items-center gap-1">
        <template v-if="!editing">
          <button class="text-[11px] px-2 py-0.5 rounded-md hover:bg-black/5" style="color:#5c4332" @click="expanded = !expanded">
            {{ expanded ? '收起' : '展开' }}
          </button>
          <button class="text-[11px] px-2 py-0.5 rounded-md hover:bg-black/5" style="color:#5c4332" @click="startEdit">✎ 编辑</button>
        </template>
        <template v-else>
          <span v-if="saveError" class="text-[10.5px]" style="color:#b03a20">{{ saveError }}</span>
          <button class="text-[11px] px-2 py-0.5 rounded-md hover:bg-black/5" style="color:#8a7965" :disabled="saving" @click="cancelEdit">取消</button>
          <button class="text-[11px] px-2.5 py-0.5 rounded-md cc-btn-primary font-semibold" :disabled="saving" @click="save">{{ saving ? '保存中...' : '保存' }}</button>
        </template>
      </div>
    </div>

    <textarea v-if="editing" v-model="draft"
      class="mt-2 w-full cc-mono text-[11.5px] p-3 rounded-md outline-none"
      style="background:#faf7f0;color:#2a1f13;border:1px solid rgba(140,100,60,0.18);min-height:320px;resize:vertical"
      :disabled="saving"></textarea>

    <pre v-else-if="expanded" class="mt-2 text-[11.5px] cc-mono p-3 rounded-md overflow-x-auto whitespace-pre-wrap" style="background:#faf7f0;color:#2a1f13;max-height:400px;overflow-y:auto">{{ file.content }}{{ file.truncated ? '\n\n... (truncated, 编辑时将只保存这部分)' : '' }}</pre>

    <div v-else class="mt-2 text-[11.5px]" style="color:#6b5a46;max-height:40px;overflow:hidden">{{ firstLines }}</div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { formatDate, formatNum } from '../utils.js';

const props = defineProps({
  file: { type: Object, required: true },
  compact: { type: Boolean, default: false }
});
const emit = defineEmits(['saved']);

const expanded = ref(false);
const editing = ref(false);
const draft = ref('');
const saving = ref(false);
const saveError = ref('');

const firstLines = computed(() =>
  (props.file.content || '').split('\n').slice(0, 2).join(' · ').slice(0, 160)
);

const startEdit = () => {
  draft.value = props.file.content || '';
  saveError.value = '';
  editing.value = true;
  expanded.value = true;
};

const cancelEdit = () => {
  editing.value = false;
  saveError.value = '';
};

const save = async () => {
  saving.value = true;
  saveError.value = '';
  try {
    const resp = await fetch('/apps/claude-code/memory/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: props.file.name, content: draft.value })
    });
    const data = await resp.json();
    if (!data.ok) {
      saveError.value = data.error || '保存失败';
      return;
    }
    editing.value = false;
    emit('saved');
  } catch (err) {
    saveError.value = err?.message || String(err);
  } finally {
    saving.value = false;
  }
};
</script>
