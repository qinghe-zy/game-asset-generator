import { describe, expect, it } from 'vitest'
import {
  DEFAULT_RUNTIME_CONFIG,
  RUNTIME_CONFIG_STORAGE_KEY,
  loadRuntimeConfig,
  saveRuntimeConfig,
} from './runtimeConfig'

describe('runtimeConfig', () => {
  it('loads defaults when no settings were saved', () => {
    expect(loadRuntimeConfig()).toEqual(DEFAULT_RUNTIME_CONFIG)
  })

  it('persists and reloads a runtime config', () => {
    saveRuntimeConfig({
      apiMode: 'vps-proxy',
      earconsEnabled: false,
      textDebugEnabled: false,
    })

    expect(loadRuntimeConfig()).toEqual({
      apiMode: 'vps-proxy',
      earconsEnabled: false,
      textDebugEnabled: false,
    })
  })

  it('falls back safely when saved settings are invalid', () => {
    localStorage.setItem(
      RUNTIME_CONFIG_STORAGE_KEY,
      JSON.stringify({
        apiMode: 'frontend-key',
        earconsEnabled: 'yes',
        textDebugEnabled: true,
      }),
    )

    expect(loadRuntimeConfig()).toEqual({
      ...DEFAULT_RUNTIME_CONFIG,
      textDebugEnabled: true,
    })
  })
})
