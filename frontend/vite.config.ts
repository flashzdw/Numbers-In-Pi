import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        // 默认使用本地 Node.js 服务的端口 (3000)，如需使用 worker 服务可配置环境变量 VITE_USE_WORKER=true
        target: process.env.VITE_USE_WORKER === 'true' ? 'http://localhost:8787' : 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})