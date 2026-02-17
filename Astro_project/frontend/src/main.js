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

// Styles
import 'unfonts.css'

const app = createApp(App)
const pinia = createPinia() // - Creamos la instancia

app.use(pinia) // - PRIMERO: Energizamos Pinia
registerPlugins(app) // SEGUNDO: Cargamos Vuetify y Router

app.mount('#app')