import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AgentPlan } from './AgentPlan'
import type { AgentPlanRequest } from './AgentProvider'
import { LlmAgentProvider, LlmAgentProviderError } from './LlmAgentProvider'

const validPlan: AgentPlan = {
  id: 'remote-plan-1',
  summary: '创建远端流程图',
  requiresConfirmation: true,
  operations: [
    {
      id: 'create-start',
      type: 'create-shape',
      elementId: 'start',
      shape: 'rounded-rect',
      label: '开始',
    },
  ],
  layoutIntent: {
    type: 'flow',
    mode: 'global',
    direction: 'LR',
  },
  speechFeedback: '我会创建一个远端流程图。',
}

const request: AgentPlanRequest = {
  prompt: '画一个审批流程图',
  canvasSummary: {
    title: 'Demo',
    version: 2,
    elementCount: 0,
    nodes: [],
    groups: [],
    relations: [],
    selectedIds: [],
    recentChanges: [],
    truncatedNodeCount: 0,
  },
  existingElementIds: [],
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('LlmAgentProvider', () => {
  it('posts planning context to the configured API and returns a validated AgentPlan', async () => {
    let lastRequestInit: RequestInit | undefined
    const fetchMock = vi.fn(
      async (_url: RequestInfo | URL, init?: RequestInit) => {
        lastRequestInit = init

        return new Response(JSON.stringify({ plan: validPlan }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    )
    const provider = new LlmAgentProvider({
      apiBaseUrl: 'https://040415.xyz',
      fetch: fetchMock,
    })

    const plan = await provider.plan(request)

    expect(plan).toMatchObject({
      id: 'remote-plan-1',
      summary: '创建远端流程图',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://040415.xyz/api/agent/plan',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    expect(JSON.parse(lastRequestInit?.body as string)).toMatchObject({
      prompt: '画一个审批流程图',
      canvasSummary: { title: 'Demo', version: 2 },
      existingElementIds: [],
    })
  })

  it('does not duplicate the api prefix when the configured base already points at api', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ plan: validPlan }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    )
    const provider = new LlmAgentProvider({
      apiBaseUrl: '/api',
      fetch: fetchMock,
    })

    await provider.plan(request)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/agent/plan',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('throws a typed HTTP error when the remote API rejects the request', async () => {
    const provider = new LlmAgentProvider({
      apiBaseUrl: '/api',
      fetch: async () =>
        new Response(JSON.stringify({ message: 'missing key' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
    })

    await expect(provider.plan(request)).rejects.toMatchObject({
      code: 'HTTP_ERROR',
      status: 401,
      message: 'missing key',
    } satisfies Partial<LlmAgentProviderError>)
  })

  it('throws a typed validation error when the remote API returns an invalid plan', async () => {
    const provider = new LlmAgentProvider({
      apiBaseUrl: '/api/',
      fetch: async () =>
        new Response(
          JSON.stringify({
            plan: {
              ...validPlan,
              operations: [
                {
                  id: 'delete-missing',
                  type: 'delete-element',
                  elementId: 'missing',
                },
              ],
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
    })

    await expect(provider.plan(request)).rejects.toMatchObject({
      code: 'PLAN_VALIDATION_ERROR',
    } satisfies Partial<LlmAgentProviderError>)
  })

  it('aborts the remote request when the timeout elapses', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'))
          })
        }),
    )
    const provider = new LlmAgentProvider({
      apiBaseUrl: '/api',
      fetch: fetchMock,
      timeoutMs: 25,
    })
    const planning = provider.plan(request)
    const timeoutExpectation = expect(planning).rejects.toMatchObject({
      code: 'TIMEOUT',
    } satisfies Partial<LlmAgentProviderError>)

    await vi.advanceTimersByTimeAsync(25)

    await timeoutExpectation
    expect(fetchMock.mock.calls[0][1]?.signal).toMatchObject({ aborted: true })

    vi.useRealTimers()
  })

  it('throws a typed abort error when the caller cancels planning', async () => {
    const callerController = new AbortController()
    const fetchMock = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'))
          })
        }),
    )
    const provider = new LlmAgentProvider({
      apiBaseUrl: '/api',
      fetch: fetchMock,
      timeoutMs: 5_000,
    })
    const planning = provider.plan({
      ...request,
      signal: callerController.signal,
    })
    const abortExpectation = expect(planning).rejects.toMatchObject({
      code: 'ABORTED',
    } satisfies Partial<LlmAgentProviderError>)

    callerController.abort()

    await abortExpectation
  })
})
