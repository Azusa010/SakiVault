/* eslint-disable @typescript-eslint/no-require-imports -- Electron sandbox preload 必须使用 CommonJS。 */
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  //标记当前运行在 Electron 桌面端。
  isDesktop: true,
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  toggleMaximizeWindow: () => ipcRenderer.send('window:toggle-maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  getBangumiNext: (pathname, query) => ipcRenderer.invoke('bangumi:next-get', pathname, query),
  searchAnime: (rule, keyword) => ipcRenderer.invoke('watch:search', rule, keyword),
  listAnimeRules: () => ipcRenderer.invoke('watch:list-rules'),
  loadAnimeRule: (name) => ipcRenderer.invoke('watch:load-rule', name),
  loadAnimeEpisodes: (rule, resultUrl) =>
    ipcRenderer.invoke('watch:load-episodes', rule, resultUrl),
  resolveAnimeStream: (episodeUrl) => ipcRenderer.invoke('watch:resolve-stream', episodeUrl),
  checkAnimeSources: (keyword) => ipcRenderer.invoke('watch:check-sources', keyword),
  onAnimeSourceChecked: (lisenter) => {
    const handler = (_event, result) => lisenter(result)
    ipcRenderer.on('watch:source-checked', handler)
    return () => {
      ipcRenderer.removeListener('watch:source-checked', handler)
    }
  },
})
