import { builtinModules } from 'node:module'
import { defineConfig } from 'vite'

// 保持 Electron 与 Node 内置模块由运行时提供，避免被打进主进程包。
const externalModules = [
  'electron',
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
]

export default defineConfig({
  build: {
    outDir: 'dist-electron',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: 'electron/main.ts',
      formats: ['es'],
    },
    rollupOptions: {
      external: externalModules,
      output: {
        entryFileNames: 'main.mjs',
        chunkFileNames: 'chunks/[name]-[hash].mjs',
      },
    },
  },
})
