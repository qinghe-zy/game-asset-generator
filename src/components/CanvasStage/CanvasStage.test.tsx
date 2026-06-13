import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { CanvasStage } from './CanvasStage'

let container: HTMLDivElement | undefined

afterEach(() => {
  container?.remove()
  container = undefined
})

const renderCanvasStage = () => {
  container = document.createElement('div')
  document.body.append(container)

  act(() => {
    createRoot(container!).render(<CanvasStage />)
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
  })
})
