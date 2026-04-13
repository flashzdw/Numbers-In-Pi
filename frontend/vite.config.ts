import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        // 代理到本地运行的 Cloudflare Worker 模拟器端口
        target: 'http://localhost:8787',
        changeOrigin: true,
      }
    }
  }
})
