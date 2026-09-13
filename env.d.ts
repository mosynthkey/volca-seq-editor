/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_RUNTIME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
