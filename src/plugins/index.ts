import type { App } from 'vue'
import vuetify from './vuetify'

export const registerPlugins = (app: App) => {
  app.use(vuetify)
}
