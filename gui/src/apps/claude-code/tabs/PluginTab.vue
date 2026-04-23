<template>
  <div class="h-full overflow-y-auto cc-thin-scroll px-6 py-5 space-y-5">
    <div class="flex items-end justify-between gap-3">
      <div>
        <div class="text-[17px] font-bold">插件</div>
        <div class="text-[11.5px]" style="color:#6b5a46">来自 <span class="cc-mono">claude plugin list --json --available</span></div>
      </div>
      <div class="flex items-center gap-2">
        <input v-model="query" type="text" placeholder="按名字或描述搜索..."
          class="px-3 py-1.5 rounded-md border bg-white text-[12px] outline-none w-64"
          style="border-color:rgba(140,100,60,0.2);color:#2a1f13" />
      </div>
    </div>

    <div v-if="loading" class="text-[12px]" style="color:#8a7965">加载 marketplace...</div>
    <div v-else-if="!data?.ok" class="text-[12px]" style="color:#b03a20">{{ data?.error || '加载失败' }}</div>
    <template v-else>
      <!-- 已安装 -->
      <div>
        <div class="flex items-baseline gap-2 mb-2">
          <div class="text-[12px] font-bold uppercase tracking-wider" style="color:#8a7965">已安装</div>
          <span class="text-[10.5px]" style="color:#8a7965">
            {{ filteredInstalled.length }} / {{ data.installed?.length || 0 }}
          </span>
        </div>
        <div v-if="!data.installed?.length" class="text-[11.5px]" style="color:#8a7965">(无)</div>
        <div v-else-if="!filteredInstalled.length" class="text-[11.5px]" style="color:#8a7965">无匹配</div>
        <div v-else class="grid grid-cols-2 gap-3">
          <div v-for="p in filteredInstalled" :key="p.id" class="cc-card">
            <div class="flex items-start gap-3">
              <div class="cc-icon">✓</div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <div class="text-[12.5px] font-bold truncate">{{ (p.id || '').split('@')[0] }}</div>
                  <span class="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                    :style="p.enabled ? 'background:rgba(31,138,92,.12);color:#1f8a5c' : 'background:rgba(176,58,32,.1);color:#b03a20'">
                    {{ p.enabled ? '已启用' : '已禁用' }}
                  </span>
                </div>
                <div class="text-[10.5px] cc-mono mt-0.5" style="color:#8a7965">v{{ p.version }} · {{ p.scope }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 市场 -->
      <div>
        <div class="flex items-baseline gap-2 mb-2">
          <div class="text-[12px] font-bold uppercase tracking-wider" style="color:#8a7965">市场</div>
          <span class="text-[10.5px]" style="color:#8a7965">
            {{ Math.min(visibleCount, filteredMarketplace.length) }} / {{ filteredMarketplace.length }}
            <span v-if="query && filteredMarketplace.length !== (data.marketplace?.length || 0)" style="color:#b97d1a">{{ '(共 {n})'.replace('{n}', String(data.marketplace?.length || 0)) }}</span>
          </span>
        </div>
        <div v-if="!filteredMarketplace.length" class="text-[11.5px]" style="color:#8a7965">无匹配</div>
        <div v-else class="grid grid-cols-2 gap-3">
          <div v-for="p in pagedMarketplace" :key="p.pluginId" class="cc-card">
            <div class="flex items-start gap-3">
              <div class="cc-icon">🧩</div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <div class="text-[12.5px] font-bold truncate">{{ p.name }}</div>
                  <span v-if="p.installCount" class="text-[10px] cc-mono" style="color:#8a7965">↓{{ formatNum(p.installCount) }}</span>
                </div>
                <div class="text-[11px] mt-0.5 leading-snug" style="color:#6b5a46">{{ p.description || '-' }}</div>
              </div>
            </div>
            <div class="mt-2">
              <button class="text-[11px] rounded-md px-2.5 py-1 cc-btn-primary font-semibold">安装</button>
            </div>
          </div>
        </div>
        <div v-if="filteredMarketplace.length > visibleCount" class="flex justify-center pt-3">
          <button class="text-[11.5px] px-4 py-1.5 rounded-md border bg-white hover:bg-[#fdf7e8]"
            style="border-color:rgba(140,100,60,0.18);color:#4a3826"
            @click="visibleCount += 30">
            {{ '加载更多 ({n} 个剩余)'.replace('{n}', String(filteredMarketplace.length - visibleCount)) }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { formatNum } from '../utils.js';

const props = defineProps({
  data: { type: Object, default: null },
  loading: { type: Boolean, default: false }
});

const query = ref('');
const visibleCount = ref(30);

const matches = (p, q) => {
  if (!q) return true;
  const text = `${p.name || ''} ${p.description || ''} ${p.pluginId || p.id || ''}`.toLowerCase();
  return text.includes(q);
};

const filteredInstalled = computed(() => {
  const q = query.value.trim().toLowerCase();
  const arr = props.data?.installed || [];
  return q ? arr.filter((p) => matches({ name: (p.id || '').split('@')[0], pluginId: p.id }, q)) : arr;
});

const filteredMarketplace = computed(() => {
  const q = query.value.trim().toLowerCase();
  const arr = props.data?.marketplace || [];
  return q ? arr.filter((p) => matches(p, q)) : arr;
});

const pagedMarketplace = computed(() => filteredMarketplace.value.slice(0, visibleCount.value));

// Reset pagination whenever search query changes
watch(query, () => { visibleCount.value = 30; });
</script>
