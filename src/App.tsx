import './App.css'
import { useVoiceCanvasController } from './app/useVoiceCanvasController'
import { CanvasStage } from './components/CanvasStage/CanvasStage'
import { CommandLog } from './components/CommandLog/CommandLog'
import { PendingPlanPanel } from './components/PendingPlanPanel/PendingPlanPanel'
import { StatusBar } from './components/StatusBar/StatusBar'
import { VoiceBar } from './components/VoiceBar/VoiceBar'

function App() {
  const controller = useVoiceCanvasController()

  return (
    <main className="appShell">
      <StatusBar
        title="AI 语音绘图工作台"
        subtitle="Local agent · structured canvas"
        statusMessage={controller.statusMessage}
        segments={[
          { label: 'Agent', value: 'Local template', tone: 'ready' },
          { label: 'STT', value: 'STT 文本兜底', tone: 'warning' },
          { label: 'Canvas', value: `${controller.projectState.elementOrder.length} items` },
        ]}
      />

      <section className="workspace" aria-label="Voice Canvas workspace">
        <div className="canvasColumn">
          {controller.pendingPlan ? (
            <PendingPlanPanel
              plan={controller.pendingPlan}
              onExecute={controller.executePendingPlan}
              onCancel={controller.cancelPendingPlan}
              onRefine={controller.refinePendingPlan}
            />
          ) : null}
          <CanvasStage projectState={controller.projectState} />
        </div>
        <CommandLog entries={controller.commandLog} />
      </section>

      <VoiceBar
        textPrompt={controller.textPrompt}
        canUndo={controller.canUndo}
        canRedo={controller.canRedo}
        onTextPromptChange={controller.setTextPrompt}
        onSubmitText={controller.requestPlan}
        onUndo={controller.undo}
        onRedo={controller.redo}
      />
    </main>
  )
}

export default App
