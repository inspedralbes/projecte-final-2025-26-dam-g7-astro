/**
 * main.js
 */

// Plugins
import { registerPlugins } from '@/plugins'
import { createPinia } from 'pinia' // - Importación directa

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'
import i18n from '@/i18n' // <-- Import i18n configuration

// Styles
import 'unfonts.css'

const app = createApp(App)
const pinia = createPinia() // - Creamos la instancia

app.use(pinia) // - PRIMERO: Energizamos Pinia
app.use(i18n)  // - Inyectar i18n para tener $t() global
registerPlugins(app) // SEGUNDO: Cargamos Vuetify y Router

app.mount('#app')