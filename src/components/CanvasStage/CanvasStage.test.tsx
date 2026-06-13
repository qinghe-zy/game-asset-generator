import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { CanvasStage } from './CanvasStage'
import { createDemoProjectState } from '../../app/demoProjectState'
import type { ProjectState } from '../../state/projectState'

declare global {
  interface Window {
    getProjectState?: () => ProjectState
  }
}

let container: HTMLDivElement | undefined
let root: ReturnType<typeof createRoot> | undefined

afterEach(() => {
  if (root) {
    act(() => {
      root?.unmount()
    })
  }

  container?.remove()
  container = undefined
  root = undefined
})

const renderCanvasStage = () => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)

  act(() => {
    root?.render(<CanvasStage projectState={createDemoProjectState()} />)
  })
}

describe('CanvasStage', () => {
  it('renders a real canvas inside the canvas work area', () => {
    renderCanvasStage()

    expect(
      document.querySelector('[aria-label="Canvas drawing surface"]'),
    ).not.toBeNull()
    expect(document.querySelector('[data-testid="fabric-canvas"]')).toBeInstanceOf(
      HTMLCanvasElement,
    )
    const debugState = window.getProjectState?.()

    expect(debugState?.elements['voice-to-plan']?.kind).toBe('connector')
    expect(debugState?.elementOrder).toContain('voice-to-plan')
  })
})
