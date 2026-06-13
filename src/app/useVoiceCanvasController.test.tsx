import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
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
})
