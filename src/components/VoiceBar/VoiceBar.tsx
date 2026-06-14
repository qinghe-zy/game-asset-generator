import './VoiceBar.css'
import type { FormEvent } from 'react'

export interface VoiceBarProps {
  textPrompt: string
  canUndo: boolean
  canRedo: boolean
  textDebugEnabled: boolean
  onTextPromptChange(prompt: string): void
  onSubmitText(): void
  onUndo(): void
  onRedo(): void
  onExportPng(): void
  onExportProject(): void
  onImportProject(file: File): void
}

export function VoiceBar({
  textPrompt,
  canUndo,
  canRedo,
  textDebugEnabled,
  onTextPromptChange,
  onSubmitText,
  onUndo,
  onRedo,
  onExportPng,
  onExportProject,
  onImportProject,
}: VoiceBarProps) {
  const submitTextPlan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmitText()
  }

  return (
    <footer className="voiceControlBar" aria-label="语音控制">
      <div className="voiceControlCopy">
        <strong>{textDebugEnabled ? '文本兼容模式' : '语音优先模式'}</strong>
        <span>{textDebugEnabled ? 'STT 文本兜底 · Local agent route' : '文本调试输入已隐藏'}</span>
      </div>
      <form
        className={`voiceControlForm ${textDebugEnabled ? '' : 'voiceControlForm-compact'}`}
        aria-label="文本调试命令"
        onSubmit={submitTextPlan}
      >
        {textDebugEnabled ? (
          <>
            <input
              aria-label="文本兼容输入"
              value={textPrompt}
              onChange={(event) => onTextPromptChange(event.target.value)}
              placeholder="画一个用户注册登录流程图"
            />
            <button
              type="submit"
              aria-label="提交文本命令生成计划"
              data-testid="submit-text-plan"
            >
              生成计划
            </button>
          </>
        ) : null}
        <button
          type="button"
          className="voiceControlSecondary"
          data-testid="undo-command"
          aria-label="撤销上一步"
          disabled={!canUndo}
          onClick={onUndo}
        >
          撤销
        </button>
        <button
          type="button"
          className="voiceControlSecondary"
          data-testid="redo-command"
          aria-label="重做上一步"
          disabled={!canRedo}
          onClick={onRedo}
        >
          重做
        </button>
        <button
          type="button"
          className="voiceControlSecondary"
          data-testid="export-png"
          aria-label="导出 PNG"
          onClick={onExportPng}
        >
          PNG
        </button>
        <button
          type="button"
          className="voiceControlSecondary"
          data-testid="export-project-json"
          aria-label="导出项目 JSON"
          onClick={onExportProject}
        >
          JSON
        </button>
        <label className="voiceControlFileButton">
          导入
          <input
            type="file"
            accept=".json,.voicecanvas.json,application/json"
            aria-label="导入项目 JSON"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                onImportProject(file)
                event.target.value = ''
              }
            }}
          />
        </label>
      </form>
    </footer>
  )
}
