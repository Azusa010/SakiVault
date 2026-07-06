import './assets/styles/global.css'
import './assets/fonts/font.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@/assets/font_ftpgxlinezk/iconfont.js'
import App from './App.vue'
import index from './router/index'

const app = createApp(App)

app.use(createPinia())
app.use(index)

app.mount('#app')
