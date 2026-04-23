import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") }
  },
  server: {
    proxy: {
      "/ws": { target: "ws://localhost:9508", ws: true },
      "/api": { target: "http://localhost:9508" },
      "/apps": { target: "http://localhost:9508" }
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
