import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => ({
  base: mode === 'desktop' ? './' : process.env.NODE_ENV === 'production' ? '/volca-seq-editor/' : '/',
  define: {
    'import.meta.env.VITE_APP_RUNTIME': JSON.stringify(mode === 'desktop' ? 'desktop' : 'web'),
  },
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
