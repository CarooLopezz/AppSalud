/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USERS_URL?: string
  readonly VITE_ESTUDIOS_URL?: string
  readonly VITE_RECETAS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
