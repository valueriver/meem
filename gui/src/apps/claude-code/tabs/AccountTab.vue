<template>
  <div class="h-full overflow-y-auto cc-thin-scroll px-6 py-5 space-y-4">
    <div>
      <div class="text-[17px] font-bold">账户</div>
      <div class="text-[11.5px]" style="color:#6b5a46">数据来自 <span class="cc-mono">claude auth status --json</span></div>
    </div>
    <div v-if="!data" class="text-[12px]" style="color:#8a7965">加载中...</div>
    <div v-else-if="!data.available" class="text-[12px]" style="color:#b03a20">{{ data.error || '无法获取' }}</div>
    <template v-else>
      <div class="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <div class="cc-stat-card">
          <div class="cc-stat-label">登录状态</div>
          <div class="cc-stat-value" :style="data.loggedIn ? 'color:#1f8a5c' : 'color:#b03a20'">{{ data.loggedIn ? '已登录' : '未登录' }}</div>
        </div>
        <div class="cc-stat-card">
          <div class="cc-stat-label">认证方式</div>
          <div class="cc-stat-value cc-mono" style="font-size:18px">{{ data.authMethod || '-' }}</div>
        </div>
        <div class="cc-stat-card">
          <div class="cc-stat-label">服务提供方</div>
          <div class="cc-stat-value cc-mono" style="font-size:18px">{{ data.apiProvider || '-' }}</div>
        </div>
        <div class="cc-stat-card">
          <div class="cc-stat-label">套餐</div>
          <div class="cc-stat-value cc-mono" style="font-size:18px">{{ data.subscriptionType || '-' }}</div>
        </div>
      </div>

      <div class="cc-chart-card">
        <div class="cc-chart-title mb-3">账户详情</div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div class="rounded-xl border p-3" style="border-color:rgba(160,120,80,0.16);background:rgba(255,248,238,0.55)">
            <div class="text-[11px] font-semibold uppercase tracking-[0.14em]" style="color:#8a7965">邮箱</div>
            <div class="mt-1 break-all text-[14px] font-medium" style="color:#2c241c">{{ data.email || '-' }}</div>
          </div>
          <div class="rounded-xl border p-3" style="border-color:rgba(160,120,80,0.16);background:rgba(255,248,238,0.55)">
            <div class="text-[11px] font-semibold uppercase tracking-[0.14em]" style="color:#8a7965">组织名称</div>
            <div class="mt-1 text-[14px] font-medium" style="color:#2c241c">{{ data.orgName || '-' }}</div>
          </div>
          <div class="rounded-xl border p-3 md:col-span-2" style="border-color:rgba(160,120,80,0.16);background:rgba(255,248,238,0.55)">
            <div class="text-[11px] font-semibold uppercase tracking-[0.14em]" style="color:#8a7965">组织 ID</div>
            <div class="cc-mono mt-1 break-all text-[12.5px]" style="color:#5b4637">{{ data.orgId || '-' }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
defineProps({ data: { type: Object, default: null } });
</script>
