import { fileURLToPath, URL } from 'node:url'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

const proxyAgent = new HttpsProxyAgent('http://localhost:7897')

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'electron' ? './' : process.env.VERCEL ? '/' : '/SakiVault/',
  plugins: [vue(), vueJsx(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/p1': {
        target: 'https://next.bgm.tv',
        changeOrigin: true,
        secure: true,
        agent: proxyAgent,
      },
    },
  },
}))
