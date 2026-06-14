import { useState } from 'react'
import './App.css'
import { useVoiceCanvasController } from './app/useVoiceCanvasController'
import { CanvasStage } from './components/CanvasStage/CanvasStage'
import { CommandLog } from './components/CommandLog/CommandLog'
import { PendingPlanPanel } from './components/PendingPlanPanel/PendingPlanPanel'
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel'
import { StatusBar } from './components/StatusBar/StatusBar'
import { VoiceBar } from './components/VoiceBar/VoiceBar'
import {
  loadRuntimeConfig,
  saveRuntimeConfig,
  type RuntimeConfig,
} from './config/runtimeConfig'

function App() {
  const controller = useVoiceCanvasController()
  const [runtimeConfig, setRuntimeConfig] = useState(loadRuntimeConfig)

  const updateRuntimeConfig = (nextConfig: RuntimeConfig) => {
    setRuntimeConfig(nextConfig)
    saveRuntimeConfig(nextConfig)
  }

  return (
    <main className="appShell">
      <a className="skipLink" href="#voice-canvas-workspace">
        跳到画布
      </a>
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

      <section
        id="voice-canvas-workspace"
        className="workspace"
        aria-label="Voice Canvas workspace"
        tabIndex={-1}
      >
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
        <div className="sideColumn">
          <SettingsPanel
            config={runtimeConfig}
            onConfigChange={updateRuntimeConfig}
          />
          <CommandLog entries={controller.commandLog} />
        </div>
      </section>

      <VoiceBar
        textPrompt={controller.textPrompt}
        canUndo={controller.canUndo}
        canRedo={controller.canRedo}
        textDebugEnabled={runtimeConfig.textDebugEnabled}
        onTextPromptChange={controller.setTextPrompt}
        onSubmitText={controller.requestPlan}
        onUndo={controller.undo}
        onRedo={controller.redo}
      />
    </main>
  )
}

export default App
