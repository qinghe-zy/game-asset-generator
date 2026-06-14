import { useMemo, useState } from 'react'
import { buildPlanCommand } from '../agent/CommandBuilder'
import type { AgentPlan } from '../agent/AgentPlan'
import { createLocalTemplatePlan } from '../agent/LocalTemplateAgent'
import { CommandManager } from '../commands/CommandManager'
import { routeLocalCommand } from '../commands/CommandRouter'
import type { ProjectState } from '../state/projectState'
import { createDemoProjectState } from './demoProjectState'

export interface CommandLogEntry {
  id: string
  label: string
  detail: string
  tone?: 'neutral' | 'success' | 'warning'
}

export interface VoiceCanvasController {
  projectState: ProjectState
  pendingPlan: AgentPlan | null
  statusMessage: string
  textPrompt: string
  commandLog: CommandLogEntry[]
  canUndo: boolean
  canRedo: boolean
  setTextPrompt(prompt: string): void
  requestPlan(): void
  refinePendingPlan(refinement: string): void
  executePendingPlan(): void
  cancelPendingPlan(): void
  undo(): void
  redo(): void
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
  const [commandLog, setCommandLog] = useState<CommandLogEntry[]>([
    {
      id: 'initial-status',
      label: '状态',
      detail: '等待文本兼容输入',
      tone: 'neutral',
    },
  ])

  const appendCommandLog = (
    entry: Omit<CommandLogEntry, 'id'>,
  ): void => {
    setCommandLog((entries) =>
      [
        {
          id: `${Date.now()}-${entries.length}`,
          ...entry,
        },
        ...entries,
      ].slice(0, 8),
    )
  }

  const requestPlan = () => {
    const prompt = textPrompt.trim()

    if (!prompt) {
      setStatusMessage('请输入要绘制的内容')
      appendCommandLog({
        label: '提示',
        detail: '请输入要绘制的内容',
        tone: 'warning',
      })
      return
    }

    appendCommandLog({
      label: '提交',
      detail: prompt,
      tone: 'neutral',
    })

    const localResult = routeLocalCommand(prompt, {
      state: projectState,
      canUndo: commandManager.getUndoCount() > 0,
      canRedo: commandManager.getRedoCount() > 0,
      undo: () => commandManager.undo(),
      redo: () => commandManager.redo(),
      execute: (command) => commandManager.execute(command),
    })

    if (localResult.status === 'handled') {
      setProjectState(localResult.state)
      setPendingPlan(null)
      setStatusMessage(localResult.message)
      appendCommandLog({
        label: '本地命令',
        detail: localResult.message,
        tone: 'success',
      })
      return
    }

    if (localResult.status === 'clarification') {
      setPendingPlan(null)
      setStatusMessage(localResult.message)
      appendCommandLog({
        label: '澄清',
        detail: localResult.message,
        tone: 'warning',
      })
      return
    }

    if (localResult.status === 'unsupported') {
      setPendingPlan(null)
      setStatusMessage(localResult.message)
      appendCommandLog({
        label: '暂不支持',
        detail: localResult.message,
        tone: 'warning',
      })
      return
    }

    const plan = createLocalTemplatePlan(prompt)
    setPendingPlan(plan)
    setStatusMessage('计划已生成，等待确认')
    appendCommandLog({
      label: '计划',
      detail: plan.summary,
      tone: 'neutral',
    })
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
    appendCommandLog({
      label: '执行',
      detail: pendingPlan.summary,
      tone: 'success',
    })
  }

  const refinePendingPlan = (refinement: string) => {
    const prompt = refinement.trim()

    if (!prompt) {
      setStatusMessage('请输入微调内容')
      appendCommandLog({
        label: '提示',
        detail: '请输入微调内容',
        tone: 'warning',
      })
      return
    }

    const plan = createLocalTemplatePlan(prompt)
    setPendingPlan(plan)
    setStatusMessage('计划已根据文本微调更新')
    appendCommandLog({
      label: '微调',
      detail: prompt,
      tone: 'neutral',
    })
    appendCommandLog({
      label: '计划',
      detail: plan.summary,
      tone: 'neutral',
    })
  }

  const cancelPendingPlan = () => {
    setPendingPlan(null)
    setStatusMessage('已取消待执行计划')
    appendCommandLog({
      label: '取消',
      detail: '待执行计划',
      tone: 'warning',
    })
  }

  const undo = () => {
    const nextState = commandManager.undo()

    setProjectState(nextState)
    setStatusMessage('已撤销上一步生成')
    appendCommandLog({
      label: '撤销',
      detail: '上一步操作',
      tone: 'warning',
    })
  }

  const redo = () => {
    const nextState = commandManager.redo()

    setProjectState(nextState)
    setStatusMessage('已重做上一步生成')
    appendCommandLog({
      label: '重做',
      detail: '上一步操作',
      tone: 'success',
    })
  }

  return {
    projectState,
    pendingPlan,
    statusMessage,
    textPrompt,
    commandLog,
    canUndo: commandManager.getUndoCount() > 0,
    canRedo: commandManager.getRedoCount() > 0,
    setTextPrompt,
    requestPlan,
    refinePendingPlan,
    executePendingPlan,
    cancelPendingPlan,
    undo,
    redo,
  }
}
