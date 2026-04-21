#!/usr/bin/env node
// node-pty v1.x 的 prebuilt tar 解压后有时会丢失 execute bit,
// 导致 posix_spawnp 拉不起 shell。给 spawn-helper 加 +x。

const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..', 'node_modules', 'node-pty', 'prebuilds');
if (!fs.existsSync(base)) process.exit(0);

for (const sub of fs.readdirSync(base)) {
    const helper = path.join(base, sub, 'spawn-helper');
    if (fs.existsSync(helper)) {
        try { fs.chmodSync(helper, 0o755); }
        catch (e) { console.warn(`chmod ${helper} 失败: ${e.message}`); }
    }
}
