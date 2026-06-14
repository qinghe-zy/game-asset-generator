import type { Server } from 'node:http'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AgentPlan } from '../../src/agent/AgentPlan'
import { createAgentServer } from './server'
import type { AgentApiPlanRequest } from './schema'

const request: AgentApiPlanRequest = {
  prompt: '画一个登录流程图',
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

const plan: AgentPlan = {
  id: 'server-plan-1',
  summary: '创建登录流程图',
  requiresConfirmation: true,
  operations: [
    {
      id: 'create-login',
      type: 'create-shape',
      elementId: 'login',
      shape: 'rounded-rect',
      label: '登录',
    },
  ],
  layoutIntent: { type: 'flow', mode: 'global', direction: 'LR' },
  speechFeedback: '我会创建登录流程图。',
}

let server: Server | undefined

afterEach(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()))
    })
    server = undefined
  }
})

describe('agent API server', () => {
  it('responds to health checks', async () => {
    const baseUrl = await listen()

    const response = await fetch(`${baseUrl}/api/health`)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      service: 'voice-canvas-agent-api',
    })
  })

  it('uses the configured planner for valid plan requests', async () => {
    const planner = vi.fn(async () => plan)
    const baseUrl = await listen({ planner })

    const response = await fetch(`${baseUrl}/api/agent/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ plan })
    expect(planner).toHaveBeenCalledWith(request)
  })

  it('returns clear validation errors for invalid requests', async () => {
    const baseUrl = await listen()

    const response = await fetch(`${baseUrl}/api/agent/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: '' }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: 'BAD_REQUEST',
    })
  })
})

async function listen(
  options: Parameters<typeof createAgentServer>[0] = {},
): Promise<string> {
  const app = createAgentServer(options)

  server = app.listen(0)

  await new Promise<void>((resolve) => {
    server?.once('listening', () => resolve())
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Expected server to listen on a random TCP port')
  }

  return `http://127.0.0.1:${address.port}`
}
