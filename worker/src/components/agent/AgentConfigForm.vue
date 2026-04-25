<script setup>
import { reactive, watch } from 'vue';
import { useAgentStore } from '@/stores/agent';

const agent = useAgentStore();

const form = reactive({
    apiUrl: agent.apiUrl || '',
    apiKey: '',
    model:  agent.model  || '',
});

watch(() => [agent.apiUrl, agent.model], ([url, model]) => {
    if (!form.apiUrl) form.apiUrl = url || '';
    if (!form.model)  form.model  = model || '';
});

const emit = defineEmits(['saved']);

function save() {
    agent.saveConfig({
        apiUrl: form.apiUrl,
        apiKey: form.apiKey,
        model:  form.model,
    });
    form.apiKey = '';
    emit('saved');
}

defineExpose({ save });
</script>

<template>
    <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
            <label class="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-muted">API URL</label>
            <input v-model="form.apiUrl" type="text"
                placeholder="https://..."
                class="h-11 w-full rounded-[10px] border border-line bg-bg px-3 text-[13px] text-ink outline-none transition-colors focus:border-accent" />
        </div>

        <div class="flex flex-col gap-2">
            <label class="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-muted">API Key</label>
            <input v-model="form.apiKey" type="password"
                :placeholder="agent.apiKeyMasked || 'sk-...'"
                class="h-11 w-full rounded-[10px] border border-line bg-bg px-3 text-[13px] text-ink outline-none transition-colors focus:border-accent" />
            <div class="text-[11px] text-faint">留空则沿用当前配置中的 Key。</div>
        </div>

        <div class="flex flex-col gap-2">
            <label class="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-muted">Model</label>
            <input v-model="form.model" type="text"
                placeholder="gpt-4.1 / kimi / claude ..."
                class="h-11 w-full rounded-[10px] border border-line bg-bg px-3 text-[13px] text-ink outline-none transition-colors focus:border-accent" />
        </div>

        <button type="button"
            class="h-11 rounded-[10px] bg-accent text-bg text-[13px] font-semibold hover:opacity-90 transition-opacity"
            @click="save">
            保存模型配置
        </button>
    </div>
</template>
