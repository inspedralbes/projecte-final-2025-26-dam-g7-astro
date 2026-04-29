/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'astroTheme',
    themes: {
      astroTheme: {
        dark: true,
        colors: {
          background: '#05050a',
          surface: '#0a0a14',
          primary: '#00f2ff',
          secondary: '#7000ff',
          accent: '#2979ff',
          error: '#ff5252',
          info: '#2196f3',
          success: '#4caf50',
          warning: '#fb8c00',
        },
      },
    },
  },
  defaults: {
    vButton: {
      style: 'text-transform: none; letter-spacing: 0.5px; font-family: "Rajdhani", sans-serif; font-weight: 600;',
    },
  },
})
