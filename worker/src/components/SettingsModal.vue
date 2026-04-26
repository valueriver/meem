<script setup>
import { useSettingsStore } from '@/stores/settings';

const settings = useSettingsStore();
</script>

<template>
    <div v-if="settings.showSettings"
        class="fade-enter fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm"
        style="background: rgba(0, 0, 0, 0.6);"
        @click.self="settings.closeSettings">
        <div class="sheet-enter sm:animate-none w-full sm:max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col safe-top safe-bottom overflow-hidden rounded-t-2xl sm:rounded-[14px] border"
            style="background: var(--color-bg-elev); border-color: var(--color-line);">
            <!-- Header -->
            <div class="shrink-0 flex items-center justify-between px-5 py-4 border-b"
                style="border-color: var(--color-line);">
                <div>
                    <div class="font-serif font-bold text-[16px] tracking-tight"
                        style="color: var(--color-ink);">设置</div>
                    <div class="text-[11px] mt-0.5" style="color: var(--color-faint);">Meem · 漫游</div>
                </div>
                <button @click="settings.closeSettings"
                    class="w-8 h-8 flex items-center justify-center rounded-md transition-colors"
                    style="color: var(--color-muted);"
                    @mouseenter="$event.currentTarget.style.background = 'var(--color-bg-hi)'"
                    @mouseleave="$event.currentTarget.style.background = ''">
                    ✕
                </button>
            </div>

            <div class="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-6">
                <!-- ASCII 小景 -->
                <pre class="text-[11px] leading-tight font-mono whitespace-pre overflow-x-auto py-2 opacity-70"
                    style="color: var(--color-muted);">
      .                ·               .
                          _
                        _/ \_
              _       _/     \_
            _/ \_    /         \_
          _/     \__/             \___
        _/                             \__
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~</pre>

                <!-- 关于 -->
                <section>
                    <div class="text-[10px] font-mono font-bold uppercase tracking-[0.18em] mb-3"
                        style="color: var(--color-muted);">关于</div>
                    <div class="text-[13px] leading-relaxed flex flex-col gap-3">
                        <p class="font-serif font-bold text-[18px] tracking-tight"
                            style="color: var(--color-ink);">
                            忘掉 SSH。忘掉 VPN。忘掉端口转发。
                        </p>
                        <p style="color: var(--color-muted);">
                            一个 <span style="color: var(--color-accent);">Cloudflare Worker</span> 做中继，
                            <span style="color: var(--color-accent);">WebSocket</span> 做管道。<br>
                            终端、文件、Agent——<br>
                            在任何浏览器里，远程可得。
                        </p>
                        <p class="tracking-wider text-[11px] pt-1" style="color: var(--color-faint);">
                            远程访问 · 零端口暴露 · 随处可连
                        </p>
                    </div>
                </section>
            </div>

            <!-- Footer -->
            <div class="shrink-0 px-5 py-3 border-t text-center"
                style="border-color: var(--color-line);">
                <div class="text-[10px] font-mono tracking-[0.3em]"
                    style="color: var(--color-faint);">
                    MEEM · REMOTE ACCESS
                </div>
            </div>
        </div>
    </div>
</template>
