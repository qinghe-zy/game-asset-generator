export type ApiMode = 'local-template' | 'vps-proxy' | 'serverless-compatible'

export interface RuntimeConfig {
  apiMode: ApiMode
  earconsEnabled: boolean
  textDebugEnabled: boolean
}

export const RUNTIME_CONFIG_STORAGE_KEY = 'voice-canvas-runtime-config'

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  apiMode: 'local-template',
  earconsEnabled: true,
  textDebugEnabled: true,
}

export function loadRuntimeConfig(): RuntimeConfig {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_RUNTIME_CONFIG
  }

  const savedConfig = localStorage.getItem(RUNTIME_CONFIG_STORAGE_KEY)

  if (!savedConfig) {
    return DEFAULT_RUNTIME_CONFIG
  }

  try {
    return normalizeRuntimeConfig(JSON.parse(savedConfig))
  } catch {
    return DEFAULT_RUNTIME_CONFIG
  }
}

export function saveRuntimeConfig(config: RuntimeConfig): void {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.setItem(
    RUNTIME_CONFIG_STORAGE_KEY,
    JSON.stringify(normalizeRuntimeConfig(config)),
  )
}

function normalizeRuntimeConfig(value: unknown): RuntimeConfig {
  if (!value || typeof value !== 'object') {
    return DEFAULT_RUNTIME_CONFIG
  }

  const candidate = value as Partial<RuntimeConfig>

  return {
    apiMode: isApiMode(candidate.apiMode)
      ? candidate.apiMode
      : DEFAULT_RUNTIME_CONFIG.apiMode,
    earconsEnabled: typeof candidate.earconsEnabled === 'boolean'
      ? candidate.earconsEnabled
      : DEFAULT_RUNTIME_CONFIG.earconsEnabled,
    textDebugEnabled: typeof candidate.textDebugEnabled === 'boolean'
      ? candidate.textDebugEnabled
      : DEFAULT_RUNTIME_CONFIG.textDebugEnabled,
  }
}

function isApiMode(value: unknown): value is ApiMode {
  return (
    value === 'local-template' ||
    value === 'vps-proxy' ||
    value === 'serverless-compatible'
  )
}
