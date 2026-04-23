<template>
  <div class="h-full overflow-y-auto cc-thin-scroll px-6 py-5 space-y-4">
    <div>
      <div class="text-[17px] font-bold">Stats</div>
      <div class="text-[11.5px]" style="color:#6b5a46">数据来自 <span class="cc-mono">~/.claude/stats-cache.json</span></div>
    </div>
    <div v-if="!data" class="text-[12px]" style="color:#8a7965">加载中...</div>
    <div v-else-if="!data.available" class="text-[12px]" style="color:#8a7965">未生成 stats 缓存 (需要多用几次)</div>
    <template v-else>
      <div class="grid grid-cols-4 gap-3">
        <div class="cc-stat-card">
          <div class="cc-stat-label">累计会话</div>
          <div class="cc-stat-value">{{ data.totalSessions }}</div>
        </div>
        <div class="cc-stat-card">
          <div class="cc-stat-label">消息</div>
          <div class="cc-stat-value">{{ data.totalMessages?.toLocaleString() }}</div>
        </div>
        <div class="cc-stat-card">
          <div class="cc-stat-label">最长单次</div>
          <div class="cc-stat-value">
            {{ Math.round((data.longestSession?.duration || 0) / 3600000) }}<span class="text-[13px]" style="color:#8a7965;font-weight:400"> h</span>
          </div>
          <div class="cc-stat-sub">{{ '{n} 消息'.replace('{n}', String(data.longestSession?.messageCount || 0)) }}</div>
        </div>
        <div class="cc-stat-card">
          <div class="cc-stat-label">首次会话</div>
          <div class="cc-stat-value cc-mono" style="font-size:18px">{{ formatDate(data.firstSessionDate) }}</div>
        </div>
      </div>

      <div v-if="data.dailyActivity?.length" class="cc-chart-card">
        <div class="cc-chart-title">每日活动</div>
        <div class="cc-chart-sub mb-3">{{ '消息数 · 最近 {n} 天'.replace('{n}', String(Math.min(data.dailyActivity.length, 14))) }}</div>
        <div class="flex items-end gap-2" style="height:160px">
          <div v-for="d in data.dailyActivity.slice(-14)" :key="d.date" class="flex h-full flex-1 flex-col items-center justify-end gap-1 self-stretch">
            <div :title="`${d.date} · ${d.messageCount} 消息`" class="w-full rounded-t"
              :style="{ height: ((d.messageCount / maxMessages) * 100) + '%', background: 'linear-gradient(180deg,#7a5430,#5c4332)' }"></div>
            <div class="cc-mono text-[9px]" style="color:#8a7965">{{ d.date.slice(5) }}</div>
          </div>
        </div>
      </div>

      <div v-if="modelEntries.length" class="cc-chart-card">
        <div class="cc-chart-title mb-3">模型偏好 · 按 output tokens</div>
        <div class="space-y-2">
          <div v-for="m in modelEntries" :key="m.name" class="grid items-center gap-3" style="grid-template-columns:180px 1fr 80px">
            <div class="cc-mono text-[11.5px]" style="color:#4a3826">{{ m.name }}</div>
            <div class="h-2 rounded-full overflow-hidden" style="background:rgba(140,100,60,0.08)">
              <div class="h-full rounded-full" :style="{ width: (m.output / modelMax) * 100 + '%', background: '#5c4332' }"></div>
            </div>
            <div class="cc-mono text-[11px] text-right" style="color:#6b5a46">{{ formatNum(m.output) }}</div>
          </div>
        </div>
      </div>

      <div v-if="data.hourCounts" class="cc-chart-card">
        <div class="cc-chart-title mb-3">24h 活跃分布</div>
        <div class="grid gap-1" style="grid-template-columns:repeat(24,1fr)">
          <div v-for="h in 24" :key="h-1" class="rounded-sm text-center cc-mono text-[9px]"
            :style="heatStyle(h - 1)">{{ data.hourCounts?.[h - 1] || '' }}</div>
        </div>
        <div class="grid text-[9px] cc-mono mt-1" style="grid-template-columns:repeat(24,1fr);color:#8a7965">
          <span>0</span><span></span><span></span><span>3</span><span></span><span></span><span>6</span><span></span><span></span><span>9</span><span></span><span></span><span>12</span><span></span><span></span><span>15</span><span></span><span></span><span>18</span><span></span><span></span><span>21</span><span></span><span></span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatDate, formatNum } from '../utils.js';

const props = defineProps({ data: { type: Object, default: null } });

const maxMessages = computed(() => Math.max(1, ...((props.data?.dailyActivity || []).slice(-14).map((d) => d.messageCount))));

const modelEntries = computed(() => {
  const mu = props.data?.modelUsage || {};
  return Object.entries(mu).map(([name, v]) => ({ name, output: v.outputTokens || 0 })).sort((a, b) => b.output - a.output);
});
const modelMax = computed(() => Math.max(1, ...modelEntries.value.map((m) => m.output)));

const maxHour = computed(() => {
  const v = Object.values(props.data?.hourCounts || {});
  return Math.max(1, ...v);
});
const heatStyle = (h) => {
  const c = props.data?.hourCounts?.[h] || 0;
  if (!c) return { background: 'rgba(140,100,60,0.07)', color: 'transparent', padding: '8px 0' };
  const alpha = 0.25 + (c / maxHour.value) * 0.75;
  return { background: `rgba(122,84,48,${alpha.toFixed(2)})`, color: 'rgba(255,255,255,0.85)', padding: '8px 0', fontWeight: 600 };
};
</script>
