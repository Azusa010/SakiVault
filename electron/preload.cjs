/* eslint-disable @typescript-eslint/no-require-imports -- Electron sandbox preload 必须使用 CommonJS。 */
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  //标记当前运行在 Electron 桌面端。
  isDesktop: true,
  searchAnime: (rule, keyword) => ipcRenderer.invoke('watch:search', rule, keyword),
  listAnimeRules: () => ipcRenderer.invoke('watch:list-rules'),
  loadAnimeRule: (name) => ipcRenderer.invoke('watch:load-rule', name),
})
