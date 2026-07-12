# Third-Party Notices

SakiVault 的自有代码以根目录 [`LICENSE`](./LICENSE) 中的 MIT License 发布。本文件列出项目使用、引用或随发行版提供的第三方软件、规则与数据服务；它们分别受各自的许可证、服务条款和内容权利约束。

## 随桌面端发行版提供

### KazumiRules

- 项目：[`Predidit/KazumiRules`](https://github.com/Predidit/KazumiRules)
- 用途：提供本地动漫来源规则的 JSON 配置，供 SakiVault 在用户操作时解析公开网页。
- 许可证：MIT License。
- 处理方式：规则文件及其上游许可证副本位于 `electron/KazumiRules/`，构建桌面安装包时作为额外资源一并复制。

SakiVault 不托管、不上传、不提供任何视频内容；规则指向的站点及其内容由相应服务提供者和权利人负责。

### Electron、Vue 与媒体播放依赖

桌面应用和渲染界面依赖以下开源项目：

| 项目 | 用途 | 许可证 |
| --- | --- | --- |
| [Electron](https://www.electronjs.org/) | Windows 桌面运行时与主进程 API | MIT License |
| [Vue](https://vuejs.org/) / [Vue Router](https://router.vuejs.org/) / [Pinia](https://pinia.vuejs.org/) | 界面、路由与状态管理 | MIT License |
| [Axios](https://axios-http.com/) | HTTP 请求 | MIT License |
| [hls.js](https://github.com/video-dev/hls.js) | HLS 媒体播放 | Apache License 2.0 |
| [Three.js](https://threejs.org/) | 视觉效果 | MIT License |
| [VueUse](https://vueuse.org/) | 组合式工具 | MIT License |

完整依赖及其版本见根目录 `package.json` 与锁文件。各依赖的许可证应以其上游仓库和随包附带的许可证文件为准。

## 开发仓库包含，但当前 Windows 安装包不分发

### NeteaseCloudMusicApiEnhanced

- 项目：[`NeteaseCloudMusicApiEnhanced/api-enhanced`](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced)
- 用途：本地开发时可选启动的音乐 API 服务。
- 许可证：MIT License，许可证文本位于 `api-enhanced/LICENSE`，其中注明原始版权信息 `Copyright (c) 2013-2022 Binaryify`。
- 发行状态：当前 `electron-builder` 配置不会将 `api-enhanced/` 复制进 Windows 安装包。

## 第三方数据、内容与用户配置

### Bangumi

番剧条目信息通过 [Bangumi](https://bgm.tv/) 及其 API 获取。条目名称、图片、人物资料、评论等数据及相关内容的权利归相应权利人所有；使用时应遵守 Bangumi 的接口规则与服务条款。

### 音乐内容与落雪（LX）音源配置

SakiVault 可播放来自第三方服务或用户自行配置的音源；项目不提供、不存储、不分发音频文件、歌词、专辑封面或音乐平台账号凭据。

若用户自行配置或后续发行版引入落雪（LX）音源脚本，应：

1. 在此文件中补充该**具体脚本/仓库**的名称、链接和许可证；
2. 保留其要求的版权与许可证文本；
3. 遵守音源脚本、音乐服务和所在地适用的服务条款及法律法规。

音乐、歌词、封面、播放链接及相关内容的权利归其各自的权利人或服务提供方所有。

## 免责声明

本项目仅供个人学习、研究与技术交流。第三方服务的可用性、内容准确性和合规性不由 SakiVault 保证；使用者应自行确认其使用行为符合适用法律法规及第三方服务条款。
