import type { RuntimeConfig } from '../../config/runtimeConfig'
import './SettingsPanel.css'

export interface SettingsPanelProps {
  config: RuntimeConfig
  onConfigChange(config: RuntimeConfig): void
}

const apiModeOptions = [
  {
    value: 'local-template',
    label: 'Local template',
  },
  {
    value: 'vps-proxy',
    label: 'VPS API proxy',
  },
  {
    value: 'serverless-compatible',
    label: 'Serverless-compatible',
  },
] as const

export function SettingsPanel({
  config,
  onConfigChange,
}: SettingsPanelProps) {
  return (
    <aside className="settingsPanel" aria-label="运行设置">
      <div className="settingsPanelHeader">
        <span>Runtime settings</span>
        <strong>{apiModeOptions.find((option) => option.value === config.apiMode)?.label}</strong>
      </div>

      <label className="settingsField">
        <span>API 运行模式</span>
        <select
          aria-label="API 运行模式"
          value={config.apiMode}
          onChange={(event) =>
            onConfigChange({
              ...config,
              apiMode: event.target.value as RuntimeConfig['apiMode'],
            })}
        >
          {apiModeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="settingsToggle">
        <input
          type="checkbox"
          aria-label="切换音效反馈"
          checked={config.earconsEnabled}
          onChange={(event) =>
            onConfigChange({
              ...config,
              earconsEnabled: event.target.checked,
            })}
        />
        <span>音效反馈</span>
      </label>

      <label className="settingsToggle">
        <input
          type="checkbox"
          aria-label="切换文本调试输入"
          checked={config.textDebugEnabled}
          onChange={(event) =>
            onConfigChange({
              ...config,
              textDebugEnabled: event.target.checked,
            })}
        />
        <span>文本调试输入</span>
      </label>
    </aside>
  )
}
