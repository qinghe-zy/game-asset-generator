import type { AgentApiPlanRequest } from './schema'

export function buildAgentSystemPrompt(): string {
  return [
    'You are the planning brain for Voice Canvas, a voice-first structured drawing tool.',
    'Return only one JSON object that matches the AgentPlan TypeScript shape.',
    'Do not return markdown, explanations, comments, Fabric JSON, SVG, or absolute coordinates unless the user explicitly requests a named position.',
    'Use operations such as create-shape, create-text, create-connector, create-group, update-style, move-element, delete-element, and relayout-region.',
    'Prefer logical relationships and layoutIntent over exact x/y coordinates.',
    'Large creations, destructive edits, and broad relayouts must set requiresConfirmation to true.',
    'Keep operation count under 40 and use concrete element IDs from existingElementIds when modifying existing elements.',
    'Supported shapes are rectangle, rounded-rect, circle, diamond, cylinder, and sticky-note.',
  ].join('\n')
}

export function buildAgentUserPrompt(request: AgentApiPlanRequest): string {
  return JSON.stringify(
    {
      userPrompt: request.prompt,
      canvasSummary: request.canvasSummary,
      existingElementIds: request.existingElementIds,
      outputContract: {
        id: 'string',
        summary: 'string',
        requiresConfirmation: 'boolean',
        operations: 'PlanOperation[]',
        layoutIntent:
          "{ type: 'grid' | 'flow' | 'mindmap' | 'freeform', mode: 'global' | 'incremental' | 'preserve-manual', direction?: 'TB' | 'LR', anchorElementId?: string }",
        speechFeedback: 'string',
        riskFlags: 'string[]',
        fallbackReason: 'string | null',
      },
    },
    null,
    2,
  )
}
