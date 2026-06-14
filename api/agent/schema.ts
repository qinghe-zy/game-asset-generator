import type { CanvasSummary } from '../../src/agent/CanvasDescriber'

export interface AgentApiPlanRequest {
  prompt: string
  canvasSummary: CanvasSummary
  existingElementIds: string[]
}

export type ParsePlanRequestResult =
  | { ok: true; request: AgentApiPlanRequest }
  | { ok: false; status: number; message: string }

const MAX_PROMPT_LENGTH = 2000
const MAX_EXISTING_IDS = 300

export function parsePlanRequest(value: unknown): ParsePlanRequestResult {
  if (!value || typeof value !== 'object') {
    return badRequest('Request body must be a JSON object')
  }

  const body = value as Partial<AgentApiPlanRequest>
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''

  if (!prompt) {
    return badRequest('prompt is required')
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return {
      ok: false,
      status: 413,
      message: `prompt must be ${MAX_PROMPT_LENGTH} characters or fewer`,
    }
  }

  if (!isCanvasSummary(body.canvasSummary)) {
    return badRequest('canvasSummary is invalid or missing')
  }

  if (!Array.isArray(body.existingElementIds)) {
    return badRequest('existingElementIds must be an array')
  }

  const existingElementIds = body.existingElementIds
    .filter((id): id is string => typeof id === 'string' && Boolean(id.trim()))
    .slice(0, MAX_EXISTING_IDS)

  return {
    ok: true,
    request: {
      prompt,
      canvasSummary: body.canvasSummary,
      existingElementIds,
    },
  }
}

function isCanvasSummary(value: unknown): value is CanvasSummary {
  if (!value || typeof value !== 'object') {
    return false
  }

  const summary = value as Partial<CanvasSummary>

  return (
    typeof summary.title === 'string' &&
    typeof summary.version === 'number' &&
    typeof summary.elementCount === 'number' &&
    Array.isArray(summary.nodes) &&
    Array.isArray(summary.groups) &&
    Array.isArray(summary.relations) &&
    Array.isArray(summary.selectedIds) &&
    Array.isArray(summary.recentChanges) &&
    typeof summary.truncatedNodeCount === 'number'
  )
}

function badRequest(message: string): ParsePlanRequestResult {
  return { ok: false, status: 400, message }
}
