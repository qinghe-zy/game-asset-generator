import type { AgentPlan } from '../../../src/agent/AgentPlan'
import { validateAgentPlan } from '../../../src/agent/PlanValidator'
import { buildAgentSystemPrompt, buildAgentUserPrompt } from '../prompt'
import type { AgentApiPlanRequest } from '../schema'

export type AgentApiErrorCode =
  | 'MISSING_API_KEY'
  | 'MODEL_HTTP_ERROR'
  | 'MODEL_RESPONSE_ERROR'
  | 'INVALID_PLAN'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'

export class AgentApiError extends Error {
  code: AgentApiErrorCode
  status: number
  details?: string[]

  constructor(
    code: AgentApiErrorCode,
    message: string,
    status: number,
    details?: string[],
  ) {
    super(message)
    this.name = 'AgentApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export interface DeepSeekProviderOptions {
  apiKey: string
  baseUrl?: string
  model?: string
  timeoutMs?: number
  fetch?: typeof fetch
}

interface DeepSeekChatResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

const DEFAULT_BASE_URL = 'https://api.deepseek.com'
const DEFAULT_MODEL = 'deepseek-chat'
const DEFAULT_TIMEOUT_MS = 15_000

export async function createDeepSeekPlan(
  request: AgentApiPlanRequest,
  options: DeepSeekProviderOptions,
): Promise<AgentPlan> {
  const apiKey = options.apiKey.trim()

  if (!apiKey) {
    throw new AgentApiError(
      'MISSING_API_KEY',
      'DeepSeek API key is not configured on the server',
      503,
    )
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  )

  try {
    const response = await (options.fetch ?? fetch)(getChatUrl(options.baseUrl), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model ?? DEFAULT_MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildAgentSystemPrompt() },
          { role: 'user', content: buildAgentUserPrompt(request) },
        ],
      }),
      signal: controller.signal,
    })

    const payload = await readJson(response)

    if (!response.ok) {
      throw new AgentApiError(
        'MODEL_HTTP_ERROR',
        getModelErrorMessage(payload, response.status),
        response.status >= 500 ? 502 : response.status,
      )
    }

    const content = extractModelContent(payload)
    const plan = parseAgentPlan(content)
    const validation = validateReturnedPlan(plan, request.existingElementIds)

    if (!validation.ok) {
      throw new AgentApiError(
        'INVALID_PLAN',
        'Model returned an AgentPlan that failed validation',
        502,
        validation.errors,
      )
    }

    return validation.plan
  } catch (error) {
    if (error instanceof AgentApiError) {
      throw error
    }

    if (isAbortError(error)) {
      throw new AgentApiError('TIMEOUT', 'Model request timed out', 504)
    }

    throw new AgentApiError(
      'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Model request failed',
      502,
    )
  } finally {
    clearTimeout(timeoutId)
  }
}

function getChatUrl(baseUrl = DEFAULT_BASE_URL): string {
  return `${baseUrl.replace(/\/+$/, '')}/chat/completions`
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

function extractModelContent(payload: unknown): string {
  const response = payload as DeepSeekChatResponse
  const content = response.choices?.[0]?.message?.content

  if (!content) {
    throw new AgentApiError(
      'MODEL_RESPONSE_ERROR',
      'Model response did not include message content',
      502,
    )
  }

  return content
}

function parseAgentPlan(content: string): AgentPlan {
  try {
    return JSON.parse(stripCodeFence(content)) as AgentPlan
  } catch {
    throw new AgentApiError(
      'MODEL_RESPONSE_ERROR',
      'Model response was not valid JSON',
      502,
    )
  }
}

function validateReturnedPlan(
  plan: AgentPlan,
  existingElementIds: string[],
): ReturnType<typeof validateAgentPlan> {
  try {
    return validateAgentPlan(plan, { existingElementIds })
  } catch {
    throw new AgentApiError(
      'INVALID_PLAN',
      'Model returned an AgentPlan with missing or invalid fields',
      502,
    )
  }
}

function stripCodeFence(content: string): string {
  return content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
}

function getModelErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object') {
    const error = (payload as { error?: { message?: string } }).error
    if (error?.message) {
      return error.message
    }
  }

  return `Model API request failed with ${status}`
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
