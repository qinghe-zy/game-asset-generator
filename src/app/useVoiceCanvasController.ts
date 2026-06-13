import { useMemo, useState } from 'react'
import { buildPlanCommand } from '../agent/CommandBuilder'
import type { AgentPlan } from '../agent/AgentPlan'
import { createLocalTemplatePlan } from '../agent/LocalTemplateAgent'
import { CommandManager } from '../commands/CommandManager'
import type { ProjectState } from '../state/projectState'
import { createDemoProjectState } from './demoProjectState'

export interface VoiceCanvasController {
  projectState: ProjectState
  pendingPlan: AgentPlan | null
  statusMessage: string
  textPrompt: string
  canUndo: boolean
  setTextPrompt(prompt: string): void
  requestPlan(): void
  executePendingPlan(): void
  cancelPendingPlan(): void
  undo(): void
}

export function useVoiceCanvasController(): VoiceCanvasController {
  const commandManager = useMemo(
    () => new CommandManager(createDemoProjectState()),
    [],
  )
  const [projectState, setProjectState] = useState(() => commandManager.getState())
  const [pendingPlan, setPendingPlan] = useState<AgentPlan | null>(null)
  const [textPrompt, setTextPrompt] = useState('')
  const [statusMessage, setStatusMessage] = useState('等待文本兼容输入')

  const requestPlan = () => {
    const prompt = textPrompt.trim()

    if (!prompt) {
      setStatusMessage('请输入要绘制的内容')
      return
    }

    const plan = createLocalTemplatePlan(prompt)
    setPendingPlan(plan)
    setStatusMessage('计划已生成，等待确认')
  }

  const executePendingPlan = () => {
    if (!pendingPlan) {
      return
    }

    const command = buildPlanCommand(pendingPlan, {
      existingElementIds: projectState.elementOrder,
    })
    const nextState = commandManager.execute(command)

    setProjectState(nextState)
    setPendingPlan(null)
    setStatusMessage(`已执行：${pendingPlan.summary}`)
  }

  const cancelPendingPlan = () => {
    setPendingPlan(null)
    setStatusMessage('已取消待执行计划')
  }

  const undo = () => {
    const nextState = commandManager.undo()

    setProjectState(nextState)
    setStatusMessage('已撤销上一步生成')
  }

  return {
    projectState,
    pendingPlan,
    statusMessage,
    textPrompt,
    canUndo: commandManager.getUndoCount() > 0,
    setTextPrompt,
    requestPlan,
    executePendingPlan,
    cancelPendingPlan,
    undo,
  }
}
