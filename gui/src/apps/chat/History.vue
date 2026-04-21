<template>
  <div class="flex flex-col gap-0.5">

    <div v-if="!chats.length" class="py-12 text-center text-sm" :style="emptyStyle">暂无历史对话</div>

    <div
      v-for="c in chats"
      :key="c.conversation_id"
      class="group flex items-center gap-2 rounded-[9px] px-3 py-2 transition-colors"
      :style="activeId === c.conversation_id ? activeRowStyle : ''"
      @mouseover="activeId !== c.conversation_id && ($event.currentTarget.style.background = hoverBackground)"
      @mouseleave="activeId !== c.conversation_id && ($event.currentTarget.style.background='transparent')"
    >
      <!-- 编辑状态 -->
      <template v-if="editingId === c.conversation_id">
        <input
          ref="editInput"
          v-model="editTitle"
          @keydown.enter="confirmRename(c.conversation_id)"
          @keydown.escape="cancelRename"
          @blur="confirmRename(c.conversation_id)"
          class="min-w-0 flex-1 rounded-[8px] border px-2.5 py-1 text-[13px] outline-none"
          :style="inputStyle"
        />
      </template>

      <!-- 正常状态 -->
      <template v-else>
        <button @click="$emit('open-chat', c)" class="min-w-0 flex-1 cursor-pointer border-none bg-transparent p-0 text-left">
          <div class="truncate text-[13px] font-medium" :style="activeId === c.conversation_id ? activeTitleStyle : titleStyle">{{ c.title || c.conversation_id.slice(0, 8) }}</div>
          <div class="mt-0.5 text-[10px]" :style="subtleStyle">{{ c.created_at }}</div>
        </button>

        <div class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            v-if="deletingId !== c.conversation_id"
            @click.stop="startRename(c)"
            title="重命名"
            class="flex h-6 w-6 items-center justify-center rounded-[6px] border-none bg-transparent transition-all"
            :style="iconButtonStyle"
            @mouseover="$event.currentTarget.style.background=actionHoverBackground;$event.currentTarget.style.color=actionHoverColor"
            @mouseleave="$event.currentTarget.style.background='transparent';$event.currentTarget.style.color=actionColor">
            <Pencil class="h-3 w-3" />
          </button>
          <span v-if="deletingId === c.conversation_id" class="px-1 text-[10px] text-red-500">确认删除?</span>
          <button
            @click.stop="confirmDelete(c.conversation_id)"
            :title="deletingId === c.conversation_id ? '点击确认' : '删除'"
            class="flex h-6 w-6 items-center justify-center rounded-[6px] border-none transition-all"
            :style="deletingId === c.conversation_id ? 'background:#dc2626;color:#fff' : iconButtonStyle"
            @mouseover="deletingId !== c.conversation_id && ($event.currentTarget.style.background='rgba(220,38,38,0.1)') && ($event.currentTarget.style.color='#dc2626')"
            @mouseleave="deletingId !== c.conversation_id && ($event.currentTarget.style.background='transparent') && ($event.currentTarget.style.color=actionColor)">
            <Trash2 class="h-3 w-3" />
          </button>
        </div>
      </template>
    </div>

  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import { Pencil, Trash2 } from 'lucide-vue-next';
defineProps({
  activeId: { type: String, default: null }
});
defineEmits(['open-chat']);

const chats = ref([]);
const editingId = ref(null);
const editTitle = ref('');
const editInput = ref(null);
const deletingId = ref(null);
let deleteTimer = null;
const emptyStyle = 'color:rgba(0,0,0,0.35)';
const activeRowStyle = 'background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.08)';
const hoverBackground = 'rgba(0,0,0,0.04)';
const inputStyle = 'border-color:rgba(160,120,80,0.3);background:#fff;color:#2a1f13';
const titleStyle = 'color:rgba(0,0,0,0.6)';
const activeTitleStyle = 'color:#3d2f1e';
const subtleStyle = 'color:rgba(0,0,0,0.3)';
const actionColor = 'rgba(0,0,0,0.3)';
const actionHoverBackground = 'rgba(160,120,80,0.1)';
const actionHoverColor = '#5c4332';
const iconButtonStyle = `background:transparent;color:${actionColor}`;

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
  return data;
};

const fetchChats = async () => {
  chats.value = await request('/api/chat/list');
};

const startRename = (chat) => {
  editingId.value = chat.conversation_id;
  editTitle.value = chat.title || '';
  nextTick(() => editInput.value?.focus());
};

const cancelRename = () => { editingId.value = null; };

const confirmRename = (conversationId) => {
  if (editingId.value !== conversationId) return;
  const title = editTitle.value.trim();
  if (title) {
    request('/api/chat/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, title })
    }).then(fetchChats).catch(() => {});
  }
  editingId.value = null;
};

const confirmDelete = (conversationId) => {
  if (deletingId.value === conversationId) {
    clearTimeout(deleteTimer);
    deletingId.value = null;
    request('/api/chat/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId })
    }).then(fetchChats).catch(() => {});
    return;
  }
  deletingId.value = conversationId;
  deleteTimer = setTimeout(() => { deletingId.value = null; }, 2000);
};

defineExpose({ fetchChats });

onMounted(fetchChats);
</script>
