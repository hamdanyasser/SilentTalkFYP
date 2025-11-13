/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ML_SERVICE_URL: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_SIGNALR_HUB_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
