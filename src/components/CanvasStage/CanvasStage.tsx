import { useEffect, useRef } from 'react'
import { Canvas } from 'fabric'
import { renderProjectStateToFabric } from '../../canvas/FabricRenderer'
import { registerProjectStateDebug } from '../../debug/projectStateDebug'
import type { ProjectState } from '../../state/projectState'
import './CanvasStage.css'

const CANVAS_WIDTH = 1280
const CANVAS_HEIGHT = 720

export interface CanvasStageProps {
  projectState: ProjectState
}

export function CanvasStage({ projectState }: CanvasStageProps) {
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null)
  const fabricCanvasRef = useRef<Canvas | null>(null)

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
    fabricCanvasRef.current = fabricCanvas

    return () => {
      fabricCanvasRef.current = null
      void fabricCanvas.dispose()
    }
  }, [])

  useEffect(() => {
    const cleanupProjectStateDebug = registerProjectStateDebug(() => projectState)
    const fabricCanvas = fabricCanvasRef.current

    if (fabricCanvas) {
      renderProjectStateToFabric(fabricCanvas, projectState)
    }

    return cleanupProjectStateDebug
  }, [projectState])

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
