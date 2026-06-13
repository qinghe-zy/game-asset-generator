import { useEffect, useRef } from 'react'
import { Canvas } from 'fabric'
import './CanvasStage.css'

const CANVAS_WIDTH = 1280
const CANVAS_HEIGHT = 720

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
    fabricCanvas.renderAll()

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
