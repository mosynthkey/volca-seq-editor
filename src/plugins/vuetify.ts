import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'

/** Champagne faceplate — volca keys (#bba99a from hardware panel) */
export const keysThemeColors = {
  background: '#1a1613',
  surface: '#2a2420',
  primary: '#bba99a',
  secondary: '#d4c4b6',
  success: '#a89484',
  info: '#d4c4b6',
  warning: '#bba99a',
  error: '#c86b5a',
}

/** Silver faceplate + red LED — volca bass */
export const bassThemeColors = {
  background: '#12161a',
  surface: '#1e262e',
  primary: '#c5ced6',
  secondary: '#e53935',
  success: '#9aa7b2',
  info: '#c5ced6',
  warning: '#e53935',
  error: '#e53935',
}

export default createVuetify({
  theme: {
    defaultTheme: 'keys',
    themes: {
      keys: {
        dark: true,
        colors: keysThemeColors,
      },
      bass: {
        dark: true,
        colors: bassThemeColors,
      },
    },
  },
})
