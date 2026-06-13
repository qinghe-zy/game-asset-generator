import { removeElement, updateElement, type ProjectState } from '../state/projectState'
import type { Command } from './CommandManager'
import { resolveEntity, type EntityResolverContext } from './EntityResolver'

export type LocalCommandResult =
  | { status: 'handled'; message: string; state: ProjectState }
  | { status: 'clarification'; message: string; candidateIds: string[] }
  | { status: 'unsupported'; message: string; reason: string }
  | { status: 'not-local' }

export interface LocalCommandContext {
  state: ProjectState
  canUndo?: boolean
  canRedo?: boolean
  undo(): ProjectState
  redo(): ProjectState
  execute(command: Command): ProjectState
  resolverContext?: EntityResolverContext
}

const COLOR_VALUES: Record<string, string> = {
  红: '#ef4444',
  红色: '#ef4444',
  蓝: '#2563eb',
  蓝色: '#2563eb',
  绿: '#16a34a',
  绿色: '#16a34a',
  黄: '#f59e0b',
  黄色: '#f59e0b',
  紫: '#7c3aed',
  紫色: '#7c3aed',
  灰: '#6b7280',
  灰色: '#6b7280',
  黑: '#171717',
  黑色: '#171717',
  白: '#ffffff',
  白色: '#ffffff',
}

export function routeLocalCommand(
  input: string,
  context: LocalCommandContext,
): LocalCommandResult {
  const commandText = normalize(input)

  if (!commandText) {
    return { status: 'not-local' }
  }

  if (isUndoCommand(commandText)) {
    if (context.canUndo === false) {
      return {
        status: 'unsupported',
        message: '当前没有可撤销的操作',
        reason: 'undo-history-empty',
      }
    }

    return {
      status: 'handled',
      message: '已撤销上一步',
      state: context.undo(),
    }
  }

  if (isRedoCommand(commandText)) {
    if (context.canRedo === false) {
      return {
        status: 'unsupported',
        message: '当前没有可重做的操作',
        reason: 'redo-history-empty',
      }
    }

    return {
      status: 'handled',
      message: '已重做上一步',
      state: context.redo(),
    }
  }

  if (isClearCommand(commandText)) {
    return executeLocalCommand(context, clearCanvasCommand(context.state))
  }

  if (isDeleteSelectedCommand(commandText)) {
    if (context.state.selectedIds.length === 0) {
      return {
        status: 'unsupported',
        message: '当前没有选中的元素',
        reason: 'delete-selected-without-selection',
      }
    }

    return executeLocalCommand(context, deleteSelectedCommand(context.state))
  }

  if (isExportCommand(commandText)) {
    return {
      status: 'unsupported',
      message: '导出功能会在后续导出模块接入',
      reason: '导出功能尚未接入当前命令路由',
    }
  }

  const colorMatch = matchColorCommand(commandText)
  if (colorMatch) {
    return routeColorCommand(colorMatch, context)
  }

  return { status: 'not-local' }
}

function executeLocalCommand(
  context: LocalCommandContext,
  command: Command,
): LocalCommandResult {
  return {
    status: 'handled',
    message: command.label,
    state: context.execute(command),
  }
}

function routeColorCommand(
  match: { target: string; colorValue: string },
  context: LocalCommandContext,
): LocalCommandResult {
  const resolution = resolveEntity(
    match.target,
    context.state,
    context.resolverContext,
  )

  if (resolution.status === 'ambiguous') {
    return {
      status: 'clarification',
      message: '找到了多个可能的元素，请说得更具体一点',
      candidateIds: resolution.candidates,
    }
  }

  if (resolution.status === 'missing') {
    return {
      status: 'unsupported',
      message: `没有找到“${match.target}”对应的元素`,
      reason: 'entity-missing',
    }
  }

  return executeLocalCommand(
    context,
    recolorElementCommand(resolution.elementId, match.colorValue),
  )
}

function clearCanvasCommand(state: ProjectState): Command {
  return {
    id: 'clear-canvas',
    label: '已清空画布',
    apply: (currentState) =>
      state.elementOrder.reduce(
        (nextState, elementId) => removeElement(nextState, elementId),
        currentState,
      ),
  }
}

function deleteSelectedCommand(state: ProjectState): Command {
  const selectedIds = new Set(state.selectedIds)
  const removableIds = state.elementOrder.filter((elementId) => {
    const element = state.elements[elementId]

    if (!element) {
      return false
    }

    if (selectedIds.has(elementId)) {
      return true
    }

    return (
      element.kind === 'connector' &&
      (selectedIds.has(element.fromId) || selectedIds.has(element.toId))
    )
  })

  return {
    id: 'delete-selected',
    label: '已删除选中元素',
    apply: (currentState) =>
      removableIds.reduce(
        (nextState, elementId) =>
          nextState.elements[elementId]
            ? removeElement(nextState, elementId)
            : nextState,
        currentState,
      ),
  }
}

function recolorElementCommand(elementId: string, fill: string): Command {
  return {
    id: `recolor-${elementId}`,
    label: '已更新元素颜色',
    apply: (state) => {
      const element = state.elements[elementId]

      return updateElement(state, elementId, {
        style: {
          ...element.style,
          fill,
        },
      })
    },
  }
}

function matchColorCommand(
  commandText: string,
): { target: string; colorValue: string } | null {
  const match = /^把(.+?)改成(.+?)$/.exec(commandText)

  if (!match) {
    return null
  }

  const target = match[1].trim()
  const colorValue = COLOR_VALUES[match[2].trim()]

  if (!target || !colorValue) {
    return null
  }

  return { target, colorValue }
}

function isUndoCommand(commandText: string): boolean {
  return ['撤销', '撤回', '回退'].includes(commandText)
}

function isRedoCommand(commandText: string): boolean {
  return ['重做', '恢复', '前进'].includes(commandText)
}

function isClearCommand(commandText: string): boolean {
  return ['清空', '清空画布', '清除画布'].includes(commandText)
}

function isDeleteSelectedCommand(commandText: string): boolean {
  return ['删除选中', '删除选中的', '删掉选中', '删除当前选中'].includes(commandText)
}

function isExportCommand(commandText: string): boolean {
  return /^导出(画布|png|PNG|图片)?$/.test(commandText)
}

function normalize(input: string): string {
  return input.trim().replace(/\s+/g, '')
}
