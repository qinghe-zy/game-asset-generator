import type { AgentPlan } from './AgentPlan'
import type { AgentPlanRequest, AgentProvider } from './AgentProvider'
import { validateAgentPlan } from './PlanValidator'

export type LlmAgentProviderErrorCode =
  | 'HTTP_ERROR'
  | 'INVALID_RESPONSE'
  | 'PLAN_VALIDATION_ERROR'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'NETWORK_ERROR'

export class LlmAgentProviderError extends Error {
  code: LlmAgentProviderErrorCode
  status?: number
  errors?: string[]

  constructor(
    code: LlmAgentProviderErrorCode,
    message: string,
    options: { status?: number; errors?: string[] } = {},
  ) {
    super(message)
    this.name = 'LlmAgentProviderError'
    this.code = code
    this.status = options.status
    this.errors = options.errors
  }
}

export interface LlmAgentProviderOptions {
  apiBaseUrl: string
  timeoutMs?: number
  fetch?: typeof fetch
}

interface AgentPlanResponse {
  plan?: AgentPlan
  message?: string
}

const DEFAULT_TIMEOUT_MS = 15_000

export class LlmAgentProvider implements AgentProvider {
  private readonly apiBaseUrl: string
  private readonly timeoutMs: number
  private readonly fetch: typeof fetch

  constructor(options: LlmAgentProviderOptions) {
    this.apiBaseUrl = options.apiBaseUrl
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.fetch = options.fetch ?? fetch
  }

  async plan(request: AgentPlanRequest): Promise<AgentPlan> {
    const controller = new AbortController()
    let timedOut = false
    const timeoutId = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, this.timeoutMs)

    if (request.signal) {
      request.signal.addEventListener('abort', () => controller.abort(), {
        once: true,
      })
    }

    try {
      const response = await this.fetch(this.getPlanUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: request.prompt,
          canvasSummary: request.canvasSummary,
          existingElementIds: request.existingElementIds,
        }),
        signal: controller.signal,
      })

      const payload = await readJson(response)

      if (!response.ok) {
        throw new LlmAgentProviderError(
          'HTTP_ERROR',
          payload.message || `LLM API request failed with ${response.status}`,
          { status: response.status },
        )
      }

      if (!payload.plan) {
        throw new LlmAgentProviderError(
          'INVALID_RESPONSE',
          'LLM API response did not include an AgentPlan',
        )
      }

      const validation = validateAgentPlan(payload.plan, {
        existingElementIds: request.existingElementIds,
      })

      if (!validation.ok) {
        throw new LlmAgentProviderError(
          'PLAN_VALIDATION_ERROR',
          'LLM API returned an invalid AgentPlan',
          { errors: validation.errors },
        )
      }

      return validation.plan
    } catch (error) {
      if (error instanceof LlmAgentProviderError) {
        throw error
      }

      if (isAbortError(error) && timedOut) {
        throw new LlmAgentProviderError(
          'TIMEOUT',
          'LLM API request timed out',
        )
      }

      if (isAbortError(error)) {
        throw new LlmAgentProviderError(
          'ABORTED',
          'LLM API request was cancelled',
        )
      }

      throw new LlmAgentProviderError(
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'LLM API request failed',
      )
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private getPlanUrl(): string {
    const baseUrl = this.apiBaseUrl.replace(/\/+$/, '')

    if (baseUrl.endsWith('/api')) {
      return `${baseUrl}/agent/plan`
    }

    return `${baseUrl}/api/agent/plan`
  }
}

async function readJson(response: Response): Promise<AgentPlanResponse> {
  try {
    return (await response.json()) as AgentPlanResponse
  } catch {
    return {}
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
