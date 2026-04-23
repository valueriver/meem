<template>
  <div class="select-none">
    <button
      type="button"
      class="group flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[12px] transition-colors"
      :class="isActive ? 'bg-[#37373d] text-[#ffffff]' : 'text-[#cccccc] hover:bg-[#2a2d2e]'"
      :style="{ paddingLeft: `${depth * 14 + 10}px` }"
      @click="onClick"
    >
      <span
        class="inline-flex w-3 shrink-0 justify-center text-[10px] text-[#8b949e]"
        @click.stop="item.type === 'dir' && emit('toggle', item)"
      >
        <template v-if="item.type === 'dir'">{{ expanded ? '▾' : '▸' }}</template>
      </span>
      <span class="shrink-0 text-[13px]">{{ item.type === 'dir' ? '📁' : fileIcon }}</span>
      <span class="min-w-0 truncate">{{ item.name }}</span>
    </button>

    <div v-if="item.type === 'dir' && expanded">
      <div v-if="loading" class="px-3 py-1 text-[11px] text-[#6a737d]" :style="{ paddingLeft: `${depth * 14 + 28}px` }">
        Loading...
      </div>
      <div v-else-if="children.length">
        <TreeNode
          v-for="child in children"
          :key="child.path"
          :item="child"
          :depth="depth + 1"
          :expanded-paths="expandedPaths"
          :children-map="childrenMap"
          :active-path="activePath"
          :loading-paths="loadingPaths"
          @toggle="emit('toggle', $event)"
          @open-file="emit('open-file', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

defineOptions({
  name: 'TreeNode'
});

const props = defineProps({
  item: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  expandedPaths: { type: Object, required: true },
  childrenMap: { type: Object, required: true },
  activePath: { type: String, default: '' },
  loadingPaths: { type: Object, required: true }
});

const emit = defineEmits(['toggle', 'open-file']);

const expanded = computed(() => !!props.expandedPaths[props.item.path]);
const children = computed(() => props.childrenMap[props.item.path] || []);
const loading = computed(() => !!props.loadingPaths[props.item.path]);
const isActive = computed(() => props.item.type === 'file' && props.activePath === props.item.path);

const fileIcon = computed(() => {
  const lower = String(props.item.name || '').toLowerCase();
  if (lower.endsWith('.vue')) return '🟩';
  if (lower.endsWith('.js') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) return '🟨';
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return '🟦';
  if (lower.endsWith('.json')) return '🟫';
  if (lower.endsWith('.md')) return '📝';
  if (lower.endsWith('.css')) return '🎨';
  if (lower.endsWith('.html')) return '🌐';
  return '📄';
});

const onClick = () => {
  if (props.item.type === 'dir') emit('toggle', props.item);
  else emit('open-file', props.item);
};
</script>
