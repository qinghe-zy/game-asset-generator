import express from 'express'
import cors from 'cors'
import type { AgentPlan } from '../../src/agent/AgentPlan'
import {
  AgentApiError,
  createDeepSeekPlan,
} from './providers/deepseek'
import { parsePlanRequest, type AgentApiPlanRequest } from './schema'

export type AgentPlanner = (request: AgentApiPlanRequest) => Promise<AgentPlan>

export interface AgentServerOptions {
  planner?: AgentPlanner
}

export function createAgentServer(options: AgentServerOptions = {}) {
  const app = express()
  const planner = options.planner ?? createDefaultPlanner()

  app.use(cors())
  app.use(express.json({ limit: '256kb', strict: true }))

  app.get('/api/health', (_request, response) => {
    response.json({
      ok: true,
      service: 'voice-canvas-agent-api',
      mode: 'vps-proxy',
    })
  })

  app.post('/api/agent/plan', async (request, response) => {
    const parsed = parsePlanRequest(request.body)

    if (!parsed.ok) {
      response.status(parsed.status).json({
        code: parsed.status === 413 ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST',
        message: parsed.message,
      })
      return
    }

    try {
      const plan = await planner(parsed.request)
      response.json({ plan })
    } catch (error) {
      const normalized = normalizeError(error)
      response.status(normalized.status).json(normalized.body)
    }
  })

  app.use((_request, response) => {
    response.status(404).json({
      code: 'NOT_FOUND',
      message: 'Route not found',
    })
  })

  app.use(
    (
      error: Error,
      _request: express.Request,
      response: express.Response,
      next: express.NextFunction,
    ) => {
      void next
      response.status(400).json({
        code: 'BAD_REQUEST',
        message: error.message || 'Invalid request body',
      })
    },
  )

  return app
}

function createDefaultPlanner(): AgentPlanner {
  return (request) =>
    createDeepSeekPlan(request, {
      apiKey: process.env.DEEPSEEK_API_KEY ?? '',
      baseUrl: process.env.DEEPSEEK_BASE_URL,
      model: process.env.DEEPSEEK_MODEL,
    })
}

function normalizeError(error: unknown): {
  status: number
  body: { code: string; message: string; details?: string[] }
} {
  if (error instanceof AgentApiError) {
    return {
      status: error.status,
      body: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    }
  }

  return {
    status: 500,
    body: {
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unexpected API error',
    },
  }
}

if (process.env.NODE_ENV !== 'test') {
  const host = process.env.AGENT_API_HOST ?? '127.0.0.1'
  const port = Number(process.env.AGENT_API_PORT ?? 3000)

  createAgentServer().listen(port, host, () => {
    console.log(`Voice Canvas agent API listening on http://${host}:${port}`)
  })
}
