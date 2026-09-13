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

/** Silver faceplate — volca bass (#c8c8c9 from hardware panel) */
export const bassThemeColors = {
  background: '#141516',
  surface: '#222426',
  primary: '#c8c8c9',
  secondary: '#e4e4e5',
  success: '#a8a8aa',
  info: '#e4e4e5',
  warning: '#c8c8c9',
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
