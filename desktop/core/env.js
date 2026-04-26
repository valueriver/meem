const fs = require('fs');
const path = require('path');

// 加载 desktop/.env（如存在），override 掉 shell 里的同名变量
(() => {
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) return;
    const text = fs.readFileSync(envPath, 'utf8');
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq < 0) continue;
        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        process.env[key] = value;
    }
})();

const MEEM_URL = process.env.MEEM_URL;
if (!MEEM_URL) {
    console.error('❌ 未设置 MEEM_URL');
    console.error('   · 在 desktop/ 下创建 .env（参考 .env.example）');
    console.error('   · 或命令行传入：MEEM_URL=https://meem.xxx.workers.dev npm start');
    process.exit(1);
}

let parsed;
try {
    parsed = new URL(MEEM_URL);
} catch {
    console.error(`❌ MEEM_URL 不是合法的 URL: ${MEEM_URL}`);
    process.exit(1);
}

const SERVER_URL = `${parsed.protocol === 'https:' ? 'wss:' : 'ws:'}//${parsed.host}`;
const WEB_URL = parsed.origin;
const SESSION_PASSWORD = String(process.env.SESSION_PASSWORD || '').trim();
const BROWSER_CHANNEL = process.env.BROWSER_CHANNEL || 'chrome';
const DEBUG = process.env.MEEM_DEBUG === '1';

module.exports = {
    MEEM_URL,
    SERVER_URL,
    WEB_URL,
    SESSION_PASSWORD,
    BROWSER_CHANNEL,
    DEBUG,
};
