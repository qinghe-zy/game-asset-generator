import './App.css'
import { useVoiceCanvasController } from './app/useVoiceCanvasController'
import { CanvasStage } from './components/CanvasStage/CanvasStage'
import { PendingPlanPanel } from './components/PendingPlanPanel/PendingPlanPanel'

function App() {
  const controller = useVoiceCanvasController()

  const submitTextPlan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    controller.requestPlan()
  }

  return (
    <main className="appShell">
      <header className="topBar">
        <div>
          <p className="eyebrow">Voice Canvas</p>
          <h1>AI 语音绘图工作台</h1>
        </div>
        <div className="statusPill">{controller.statusMessage}</div>
      </header>

      <section className="workspace" aria-label="Voice Canvas workspace">
        {controller.pendingPlan ? (
          <PendingPlanPanel
            plan={controller.pendingPlan}
            onExecute={controller.executePendingPlan}
            onCancel={controller.cancelPendingPlan}
          />
        ) : null}
        <CanvasStage projectState={controller.projectState} />
      </section>

      <footer className="voiceBar">
        <div>
          <strong>文本兼容模式</strong>
          <span>用于 STT 不可用时验证本地 Agent 链路</span>
        </div>
        <form className="textCommandForm" onSubmit={submitTextPlan}>
          <input
            aria-label="文本兼容输入"
            value={controller.textPrompt}
            onChange={(event) => controller.setTextPrompt(event.target.value)}
            placeholder="画一个用户注册登录流程图"
          />
          <button type="submit" data-testid="submit-text-plan">
            生成计划
          </button>
          <button
            type="button"
            className="secondaryAction"
            disabled={!controller.canUndo}
            onClick={controller.undo}
          >
            撤销
          </button>
        </form>
      </footer>
    </main>
  )
}

export default App
