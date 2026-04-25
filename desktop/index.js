const { boot } = require('./app');

boot().catch((err) => {
    console.error('启动失败:', err.message);
    process.exit(1);
});
