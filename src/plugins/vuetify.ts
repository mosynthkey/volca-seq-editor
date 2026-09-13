import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'

/** Gold faceplate — volca keys */
export const keysThemeColors = {
  background: '#1c1712',
  surface: '#2a2218',
  primary: '#d4a84a',
  secondary: '#e8c56a',
  success: '#c9a227',
  info: '#e8c56a',
  warning: '#d4a84a',
  error: '#e86b5a',
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
