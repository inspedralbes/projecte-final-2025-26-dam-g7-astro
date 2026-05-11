/**
 * main.js
 */

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import i18n from '@/i18n'
import { registerPlugins } from '@/plugins'
import App from './App.vue'

// Styles
import 'unfonts.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)
registerPlugins(app)

app.mount('#app')
