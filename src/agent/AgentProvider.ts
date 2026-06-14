import type { CanvasSummary } from './CanvasDescriber'
import type { AgentPlan } from './AgentPlan'

export interface AgentPlanRequest {
  prompt: string
  canvasSummary: CanvasSummary
  existingElementIds: string[]
  signal?: AbortSignal
}

export interface AgentProvider {
  plan(request: AgentPlanRequest): Promise<AgentPlan>
}
