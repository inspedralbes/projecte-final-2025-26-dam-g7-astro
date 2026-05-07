/**
 * main.js
 */

import { createPinia } from 'pinia' // - Importación directa
// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Styles
import 'unfonts.css'

const app = createApp(App)
const pinia = createPinia() // - Creamos la instancia

app.use(pinia) // - PRIMERO: Energizamos Pinia
registerPlugins(app) // SEGUNDO: Cargamos Vuetify y Router

app.mount('#app')
