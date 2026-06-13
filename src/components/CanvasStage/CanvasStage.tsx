import { useEffect, useRef } from 'react'
import { Canvas } from 'fabric'
import { renderProjectStateToFabric } from '../../canvas/FabricRenderer'
import { addElement, createProjectState } from '../../state/projectState'
import type { CanvasElement } from '../../state/elements'
import './CanvasStage.css'

const CANVAS_WIDTH = 1280
const CANVAS_HEIGHT = 720
const demoMeta = {
  source: 'template' as const,
  createdAt: 1,
  updatedAt: 1,
}

function createDemoProjectState() {
  const elements: CanvasElement[] = [
    {
      id: 'demo-group',
      kind: 'group',
      label: 'Voice planning area',
      x: 72,
      y: 64,
      width: 308,
      height: 176,
      style: {
        fill: '#f8fafc',
        stroke: '#d9e2e8',
        strokeWidth: 1,
        textColor: '#5d6b78',
        fontSize: 13,
      },
      meta: demoMeta,
    },
    {
      id: 'voice-brief',
      kind: 'shape',
      shape: 'rounded-rect',
      label: 'Voice brief',
      parentId: 'demo-group',
      x: 96,
      y: 88,
      width: 240,
      height: 116,
      style: {
        fill: '#f3fbf7',
        stroke: '#18735d',
        strokeWidth: 2,
      },
      meta: demoMeta,
    },
    {
      id: 'voice-brief-label',
      kind: 'text',
      text: 'Describe a drawing by voice',
      parentId: 'demo-group',
      x: 122,
      y: 125,
      width: 188,
      style: {
        textColor: '#133d34',
        fontSize: 18,
        fontWeight: 'bold',
      },
      meta: demoMeta,
    },
    {
      id: 'agent-plan',
      kind: 'shape',
      shape: 'rounded-rect',
      label: 'Agent plan',
      parentId: 'demo-group',
      x: 392,
      y: 88,
      width: 220,
      height: 116,
      style: {
        fill: '#f7f7f7',
        stroke: '#171717',
        strokeWidth: 2,
      },
      meta: demoMeta,
    },
    {
      id: 'voice-to-plan',
      kind: 'connector',
      fromId: 'voice-brief',
      toId: 'agent-plan',
      label: 'plans',
      style: {
        stroke: '#64748b',
        strokeWidth: 2,
        textColor: '#334155',
        fontSize: 12,
      },
      meta: demoMeta,
    },
  ]

  return elements.reduce(
    (state, element) => addElement(state, element),
    createProjectState('Voice Canvas demo'),
  )
}

export function CanvasStage() {
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvasElement = canvasElementRef.current

    if (!canvasElement) {
      return
    }

    const fabricCanvas = new Canvas(canvasElement, {
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: false,
    })

    fabricCanvas.setDimensions({
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    })
    renderProjectStateToFabric(fabricCanvas, createDemoProjectState())

    return () => {
      void fabricCanvas.dispose()
    }
  }, [])

  return (
    <section className="canvasStage" aria-label="Canvas drawing surface">
      <canvas
        ref={canvasElementRef}
        className="canvasStageSurface"
        data-testid="fabric-canvas"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
      />
    </section>
  )
}
