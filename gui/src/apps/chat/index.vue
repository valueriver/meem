<template>
  <div class="flex min-h-0 min-w-0 flex-1 flex-col bg-bg text-ink">
    <!-- Top bar -->
    <header class="shrink-0 h-11 flex items-center gap-2 px-3 border-b border-line bg-bg">
      <div class="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
        {{ currentConversationId ? (currentTitle || '对话中') : '新会话' }}
      </div>
      <button class="icon-btn" title="新建会话" @click="newChat">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      <button class="icon-btn" title="历史会话" @click="showHistory = true">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <polyline points="12 7 12 12 15 14"/>
        </svg>
      </button>
      <button class="icon-btn" title="设置" @click="openSettings">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
    </header>

    <!-- Chat body (AIOS ChatCore) -->
    <ChatCore
      ref="chatRef"
      variant="desktop"
      :conversation-id="currentConversationId"
      :pending-message="pendingMessage"
      :intent-request="intentRequest"
      @conversation-change="onConversationChange"
      @history-change="refreshHistory"
    />

    <!-- History modal -->
    <div v-if="showHistory"
      class="fixed inset-0 z-40 flex items-center justify-center p-4"
      @click.self="showHistory = false">
      <div class="fade-enter absolute inset-0 bg-black/60"></div>
      <div class="relative z-10 flex max-h-[80vh] w-full max-w-md flex-col rounded-xl border border-line bg-bg-elev shadow-2xl">
        <div class="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
          <div class="font-serif font-bold text-[14px] text-ink">历史会话</div>
          <button
            class="flex h-7 w-7 items-center justify-center rounded text-faint hover:bg-bg-hi hover:text-ink"
            @click="showHistory = false">✕</button>
        </div>
        <div class="flex-1 overflow-y-auto p-2">
          <HistoryPanel ref="historyRef"
            :active-id="currentConversationId"
            @open-chat="openChatFromHistory" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import HistoryPanel from './History.vue';
import ChatCore from './chat.vue';

const router = useRouter();

function openSettings() {
  router.push('/app/settings');
}

defineProps({
  pendingMessage: { type: String, default: null },
  intentRequest: { type: Object, default: null }
});

const chatRef = ref(null);
const historyRef = ref(null);
const currentConversationId = ref(null);
const currentTitle = ref('');
const showHistory = ref(false);

function refreshHistory() {
  historyRef.value?.fetchChats();
}

function onConversationChange(conversationId) {
  currentConversationId.value = conversationId || null;
}

function openChatFromHistory(chat) {
  currentConversationId.value = chat.conversation_id;
  currentTitle.value = chat.title || '';
  showHistory.value = false;
}

function newChat() {
  currentConversationId.value = null;
  currentTitle.value = '';
  chatRef.value?.newChat();
}
</script>

<style scoped>
.icon-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--color-muted);
  transition: background 0.12s ease, color 0.12s ease;
}
.icon-btn:hover { background: var(--color-bg-hi); color: var(--color-ink); }
</style>
