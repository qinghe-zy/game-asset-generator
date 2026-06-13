import { describe, expect, it } from 'vitest'
import {
  MAX_PLAN_OPERATIONS,
  isValidationOk,
  validateAgentPlan,
} from './PlanValidator'
import type { AgentPlan, PlanOperation } from './AgentPlan'

const createShape = (id: string): PlanOperation => ({
  id: `create-${id}`,
  type: 'create-shape',
  elementId: id,
  shape: 'rounded-rect',
  label: id,
})

const validPlan = (): AgentPlan => ({
  id: 'plan-login',
  summary: '创建登录流程',
  requiresConfirmation: true,
  operations: [
    createShape('node_login'),
    {
      id: 'style-login',
      type: 'update-style',
      elementId: 'node_login',
      style: { fill: '#d3e5ff' },
    },
    {
      id: 'connect-login',
      type: 'create-connector',
      elementId: 'edge-login',
      fromId: 'node_login',
      toId: 'existing_dashboard',
      label: '成功',
    },
  ],
  layoutIntent: {
    type: 'flow',
    mode: 'global',
    direction: 'LR',
  },
  speechFeedback: '我会创建登录流程。',
})

describe('PlanValidator', () => {
  it('accepts a valid plan and normalizes optional fields', () => {
    const result = validateAgentPlan(validPlan(), {
      existingElementIds: ['existing_dashboard'],
    })

    expect(isValidationOk(result)).toBe(true)
    expect(result.ok ? result.plan.riskFlags : undefined).toEqual([])
    expect(result.ok ? result.plan.fallbackReason : undefined).toBeNull()
  })

  it('rejects duplicate operation IDs', () => {
    const plan = validPlan()
    plan.operations[1] = {
      ...plan.operations[1],
      id: plan.operations[0].id,
    }

    const result = validateAgentPlan(plan, {
      existingElementIds: ['existing_dashboard'],
    })

    expect(result.ok).toBe(false)
    expect(result.ok ? [] : result.errors).toContain(
      'Duplicate operation id: create-node_login',
    )
  })

  it('rejects connectors that reference missing elements', () => {
    const plan = validPlan()
    plan.operations[2] = {
      id: 'connect-missing',
      type: 'create-connector',
      elementId: 'edge-missing',
      fromId: 'node_login',
      toId: 'missing_node',
    }

    const result = validateAgentPlan(plan)

    expect(result.ok).toBe(false)
    expect(result.ok ? [] : result.errors).toContain(
      'Operation connect-missing references missing element: missing_node',
    )
  })

  it('rejects destructive delete operations without confirmation', () => {
    const plan: AgentPlan = {
      ...validPlan(),
      requiresConfirmation: false,
      operations: [
        {
          id: 'delete-login',
          type: 'delete-element',
          elementId: 'existing_login',
        },
      ],
    }

    const result = validateAgentPlan(plan, {
      existingElementIds: ['existing_login'],
    })

    expect(result.ok).toBe(false)
    expect(result.ok ? [] : result.errors).toContain(
      'Destructive operation delete-login requires confirmation',
    )
  })

  it('rejects plans with more than the operation limit', () => {
    const plan: AgentPlan = {
      ...validPlan(),
      operations: Array.from({ length: MAX_PLAN_OPERATIONS + 1 }, (_, index) =>
        createShape(`node_${index}`),
      ),
    }

    const result = validateAgentPlan(plan)

    expect(result.ok).toBe(false)
    expect(result.ok ? [] : result.errors).toContain(
      `Plan has 41 operations; maximum is ${MAX_PLAN_OPERATIONS}`,
    )
  })
})
