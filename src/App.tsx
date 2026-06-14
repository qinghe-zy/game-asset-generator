import { useRef, useState } from 'react'
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
import {
  createProjectExport,
  projectExportFileName,
} from './persistence/projectFile'

function App() {
  const controller = useVoiceCanvasController()
  const [runtimeConfig, setRuntimeConfig] = useState(loadRuntimeConfig)
  const pngExporterRef = useRef<(() => string) | null>(null)

  const updateRuntimeConfig = (nextConfig: RuntimeConfig) => {
    setRuntimeConfig(nextConfig)
    saveRuntimeConfig(nextConfig)
  }

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = fileName
    link.target = '_self'
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportProject = () => {
    downloadBlob(
      new Blob([
        JSON.stringify(createProjectExport(controller.projectState), null, 2),
      ], { type: 'application/json' }),
      projectExportFileName(controller.projectState),
    )
  }

  const exportPng = () => {
    const pngDataUrl = pngExporterRef.current?.()

    if (!pngDataUrl) {
      controller.preparePngExport()
      return
    }

    const link = document.createElement('a')

    link.href = pngDataUrl
    link.download = `${controller.projectState.title || 'voice-canvas'}.png`
    link.target = '_self'
    link.click()
    controller.preparePngExport()
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
          <CanvasStage
            projectState={controller.projectState}
            onPngExporterChange={(exporter) => {
              pngExporterRef.current = exporter
            }}
          />
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
        onExportPng={exportPng}
        onExportProject={exportProject}
        onImportProject={controller.importProjectFile}
      />
    </main>
  )
}

export default App
