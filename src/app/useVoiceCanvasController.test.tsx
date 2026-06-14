import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { PROJECT_STORAGE_KEY } from '../persistence/projectStorage'
import { createProjectExport } from '../persistence/projectFile'
import { createProjectState } from '../state/projectState'
import {
  useVoiceCanvasController,
  type VoiceCanvasController,
} from './useVoiceCanvasController'

let root: Root | null = null
let container: HTMLDivElement | null = null

afterEach(() => {
  if (root) {
    act(() => {
      root?.unmount()
    })
  }

  container?.remove()
  localStorage.clear()
  root = null
  container = null
})

function renderController() {
  let controller: VoiceCanvasController | null = null

  function Harness() {
    const current = useVoiceCanvasController()

    useEffect(() => {
      controller = current
    })

    controller = current
    return null
  }

  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)

  act(() => {
    root?.render(<Harness />)
  })

  if (!controller) {
    throw new Error('Controller did not render')
  }

  return () => {
    if (!controller) {
      throw new Error('Controller is unavailable')
    }

    return controller
  }
}

describe('useVoiceCanvasController', () => {
  it('creates a pending plan without changing the canvas', () => {
    const getController = renderController()
    const initialVersion = getController().projectState.version

    act(() => {
      getController().setTextPrompt('画一个用户注册登录流程图')
    })
    act(() => {
      getController().requestPlan()
    })

    expect(getController().pendingPlan?.summary).toContain('注册登录流程')
    expect(getController().projectState.version).toBe(initialVersion)
    expect(getController().projectState.elements['flow-entry']).toBeUndefined()
  })

  it('executes a pending plan and clears it', () => {
    const getController = renderController()

    act(() => {
      getController().setTextPrompt('画一个用户注册登录流程图')
    })
    act(() => {
      getController().requestPlan()
    })
    act(() => {
      getController().executePendingPlan()
    })

    expect(getController().pendingPlan).toBeNull()
    expect(getController().projectState.elements['flow-entry']).toMatchObject({
      kind: 'shape',
      label: '打开入口',
    })
    expect(getController().projectState.elements['connector-flow-1']).toMatchObject({
      kind: 'connector',
      fromId: 'flow-entry',
      toId: 'flow-account',
    })
    expect(getController().canUndo).toBe(true)
    expect(localStorage.getItem(PROJECT_STORAGE_KEY)).toContain('flow-entry')
  })

  it('restores a saved project state on the next mount', () => {
    let getController = renderController()

    act(() => {
      getController().setTextPrompt('画一个用户注册登录流程图')
    })
    act(() => {
      getController().requestPlan()
    })
    act(() => {
      getController().executePendingPlan()
    })

    act(() => {
      root?.unmount()
    })
    root = null
    container?.remove()
    container = null

    getController = renderController()

    expect(getController().projectState.elements['flow-entry']).toMatchObject({
      kind: 'shape',
      label: '打开入口',
    })
  })

  it('cancels a pending plan without changing the canvas', () => {
    const getController = renderController()
    const initialElementCount = getController().projectState.elementOrder.length

    act(() => {
      getController().setTextPrompt('画一个用户注册登录流程图')
    })
    act(() => {
      getController().requestPlan()
    })
    act(() => {
      getController().cancelPendingPlan()
    })

    expect(getController().pendingPlan).toBeNull()
    expect(getController().projectState.elementOrder).toHaveLength(initialElementCount)
  })

  it('undoes generated content as one macro action', () => {
    const getController = renderController()
    const initialElementOrder = getController().projectState.elementOrder

    act(() => {
      getController().setTextPrompt('画一个用户注册登录流程图')
    })
    act(() => {
      getController().requestPlan()
    })
    act(() => {
      getController().executePendingPlan()
    })
    act(() => {
      getController().undo()
    })

    expect(getController().projectState.elementOrder).toEqual(initialElementOrder)
    expect(getController().canUndo).toBe(false)
  })

  it('routes text undo through the local command router', () => {
    const getController = renderController()
    const initialElementOrder = getController().projectState.elementOrder

    act(() => {
      getController().setTextPrompt('画一个用户注册登录流程图')
    })
    act(() => {
      getController().requestPlan()
    })
    act(() => {
      getController().executePendingPlan()
    })
    act(() => {
      getController().setTextPrompt('撤销')
    })
    act(() => {
      getController().requestPlan()
    })

    expect(getController().projectState.elementOrder).toEqual(initialElementOrder)
    expect(getController().statusMessage).toBe('已撤销上一步')
  })

  it('reports empty undo history without changing the canvas', () => {
    const getController = renderController()
    const initialElementOrder = getController().projectState.elementOrder

    act(() => {
      getController().setTextPrompt('撤销')
    })
    act(() => {
      getController().requestPlan()
    })

    expect(getController().projectState.elementOrder).toEqual(initialElementOrder)
    expect(getController().statusMessage).toBe('当前没有可撤销的操作')
  })

  it('routes text redo through the local command router', () => {
    const getController = renderController()

    act(() => {
      getController().setTextPrompt('画一个用户注册登录流程图')
    })
    act(() => {
      getController().requestPlan()
    })
    act(() => {
      getController().executePendingPlan()
    })
    act(() => {
      getController().setTextPrompt('撤销')
    })
    act(() => {
      getController().requestPlan()
    })
    act(() => {
      getController().setTextPrompt('重做')
    })
    act(() => {
      getController().requestPlan()
    })

    expect(getController().projectState.elements['flow-entry']).toMatchObject({
      kind: 'shape',
      label: '打开入口',
    })
    expect(getController().statusMessage).toBe('已重做上一步')
  })

  it('reports empty redo history without changing the canvas', () => {
    const getController = renderController()
    const initialElementOrder = getController().projectState.elementOrder

    act(() => {
      getController().setTextPrompt('重做')
    })
    act(() => {
      getController().requestPlan()
    })

    expect(getController().projectState.elementOrder).toEqual(initialElementOrder)
    expect(getController().statusMessage).toBe('当前没有可重做的操作')
  })

  it('routes a text color command to a resolved canvas element', () => {
    const getController = renderController()

    act(() => {
      getController().setTextPrompt('画一个用户注册登录流程图')
    })
    act(() => {
      getController().requestPlan()
    })
    act(() => {
      getController().executePendingPlan()
    })
    act(() => {
      getController().setTextPrompt('把打开入口改成红色')
    })
    act(() => {
      getController().requestPlan()
    })

    expect(getController().projectState.elements['flow-entry'].style?.fill).toBe(
      '#ef4444',
    )
    expect(getController().statusMessage).toBe('已更新元素颜色')
  })

  it('reports png export as ready without changing state', () => {
    const getController = renderController()
    const initialElementOrder = getController().projectState.elementOrder

    act(() => {
      getController().setTextPrompt('导出 PNG')
    })
    act(() => {
      getController().requestPlan()
    })

    expect(getController().projectState.elementOrder).toEqual(initialElementOrder)
    expect(getController().statusMessage).toBe('PNG 导出已准备')
  })

  it('imports a valid project file and rejects invalid project content', async () => {
    const getController = renderController()
    const importedProject = createProjectState('导入项目')

    await act(async () => {
      getController().importProjectFile(
        new File(
          [JSON.stringify(createProjectExport(importedProject))],
          'import.voicecanvas.json',
          { type: 'application/json' },
        ),
      )
    })

    expect(getController().projectState.title).toBe('导入项目')
    expect(localStorage.getItem(PROJECT_STORAGE_KEY)).toContain('导入项目')

    await act(async () => {
      getController().importProjectFile(
        new File(['{bad json'], 'bad.voicecanvas.json', {
          type: 'application/json',
        }),
      )
    })

    expect(getController().projectState.title).toBe('导入项目')
    expect(getController().statusMessage).toBe('项目文件不是有效 JSON')
  })
})
