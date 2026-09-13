import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    defaultTheme: 'volcaDark',
    themes: {
      volcaDark: {
        dark: true,
        colors: {
          background: '#1a2228',
          surface: '#243038',
          primary: '#c4a574',
          secondary: '#3ecfbe',
          success: '#3ecfbe',
          info: '#3ecfbe',
          warning: '#c4a574',
          error: '#e86b8a',
        },
      },
    },
  },
})
