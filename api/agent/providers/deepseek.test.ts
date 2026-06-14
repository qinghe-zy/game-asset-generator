import { describe, expect, it, vi } from 'vitest'
import { createDeepSeekPlan } from './deepseek'
import type { AgentApiPlanRequest } from '../schema'

const request: AgentApiPlanRequest = {
  prompt: '画一个三层架构图',
  canvasSummary: {
    title: 'Demo',
    version: 1,
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

const planJson = {
  id: 'deepseek-plan-1',
  summary: '创建三层架构图',
  requiresConfirmation: true,
  operations: [
    {
      id: 'create-frontend',
      type: 'create-shape',
      elementId: 'frontend',
      shape: 'rounded-rect',
      label: '前端',
    },
  ],
  layoutIntent: { type: 'flow', mode: 'global', direction: 'LR' },
  speechFeedback: '我会创建三层架构图。',
}

describe('DeepSeek provider', () => {
  it('posts an OpenAI-compatible chat completion request and validates the returned AgentPlan', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify(planJson),
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
    )

    const plan = await createDeepSeekPlan(request, {
      apiKey: 'test-key',
      fetch: fetchMock,
    })

    expect(plan.summary).toBe('创建三层架构图')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.deepseek.com/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        }),
      }),
    )
  })

  it('rejects missing API keys before making a network call', async () => {
    const fetchMock = vi.fn()

    await expect(
      createDeepSeekPlan(request, { apiKey: '', fetch: fetchMock }),
    ).rejects.toMatchObject({
      code: 'MISSING_API_KEY',
      status: 503,
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects invalid model output before returning it to the frontend', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: '{"summary":"missing fields"}' } }],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
    )

    await expect(
      createDeepSeekPlan(request, { apiKey: 'test-key', fetch: fetchMock }),
    ).rejects.toMatchObject({
      code: 'INVALID_PLAN',
      status: 502,
    })
  })
})
