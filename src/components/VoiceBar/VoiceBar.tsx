import './VoiceBar.css'
import type { FormEvent } from 'react'

export interface VoiceBarProps {
  textPrompt: string
  canUndo: boolean
  canRedo: boolean
  onTextPromptChange(prompt: string): void
  onSubmitText(): void
  onUndo(): void
  onRedo(): void
}

export function VoiceBar({
  textPrompt,
  canUndo,
  canRedo,
  onTextPromptChange,
  onSubmitText,
  onUndo,
  onRedo,
}: VoiceBarProps) {
  const submitTextPlan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmitText()
  }

  return (
    <footer className="voiceControlBar" aria-label="语音控制">
      <div className="voiceControlCopy">
        <strong>文本兼容模式</strong>
        <span>STT 文本兜底 · Local agent route</span>
      </div>
      <form className="voiceControlForm" onSubmit={submitTextPlan}>
        <input
          aria-label="文本兼容输入"
          value={textPrompt}
          onChange={(event) => onTextPromptChange(event.target.value)}
          placeholder="画一个用户注册登录流程图"
        />
        <button type="submit" data-testid="submit-text-plan">
          生成计划
        </button>
        <button
          type="button"
          className="voiceControlSecondary"
          data-testid="undo-command"
          disabled={!canUndo}
          onClick={onUndo}
        >
          撤销
        </button>
        <button
          type="button"
          className="voiceControlSecondary"
          data-testid="redo-command"
          disabled={!canRedo}
          onClick={onRedo}
        >
          重做
        </button>
      </form>
    </footer>
  )
}
