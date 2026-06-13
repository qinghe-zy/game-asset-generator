import { describe, expect, it } from 'vitest'
import { CommandManager } from '../commands/CommandManager'
import type { LayoutEngine, LayoutRequest, LayoutResult } from '../layout/LayoutEngine'
import { addElement, createProjectState } from '../state/projectState'
import type { ShapeElement } from '../state/elements'
import type { AgentPlan } from './AgentPlan'
import { buildPlanCommand } from './CommandBuilder'
import { createLocalTemplatePlan } from './LocalTemplateAgent'

class FixedLayoutEngine implements LayoutEngine {
  requests: LayoutRequest[] = []

  layout(request: LayoutRequest): LayoutResult {
    this.requests.push(request)

    return {
      positions: request.nodes.map((node, index) => ({
        id: node.id,
        x: 100 + index * 220,
        y: 80 + index * 40,
      })),
      connectors: request.connectors.map((connector) => ({ ...connector })),
    }
  }
}

describe('CommandBuilder', () => {
  it('builds one macro command that creates a local template flow plan', () => {
    const layoutEngine = new FixedLayoutEngine()
    const manager = new CommandManager(createProjectState('画布'))
    const plan = createLocalTemplatePlan('请画一个用户注册登录流程图')
    const command = buildPlanCommand(plan, { layoutEngine, timestamp: 10 })

    manager.execute(command)

    const state = manager.getState()
    expect(command.id).toBe(`execute-${plan.id}`)
    expect(command.label).toBe(plan.summary)
    expect(state.elements['flow-entry']).toMatchObject({
      kind: 'shape',
      label: '打开入口',
      x: 100,
      y: 80,
      meta: { source: 'agent', createdAt: 10, updatedAt: 10 },
    })
    expect(state.elements['connector-flow-1']).toMatchObject({
      kind: 'connector',
      fromId: 'flow-entry',
      toId: 'flow-account',
      label: '开始',
    })
    expect(layoutEngine.requests).toHaveLength(1)
    expect(layoutEngine.requests[0].nodes.map((node) => node.id)).toContain('flow-entry')
  })

  it('creates logical group elements and keeps child parent IDs for architecture plans', () => {
    const layoutEngine = new FixedLayoutEngine()
    const manager = new CommandManager(createProjectState('画布'))
    const plan = createLocalTemplatePlan('设计前端后端数据库三层架构图')

    manager.execute(buildPlanCommand(plan, { layoutEngine, timestamp: 20 }))

    const state = manager.getState()
    const frontendGroup = state.elements['architecture-frontend']
    const webApp = state.elements['architecture-web-app']
    const mobile = state.elements['architecture-mobile']

    expect(frontendGroup).toMatchObject({
      kind: 'group',
      label: '前端体验层',
    })
    expect(webApp).toMatchObject({
      parentId: 'architecture-frontend',
    })
    expect(state.elements['architecture-api-gateway']).toMatchObject({
      parentId: 'architecture-backend',
    })
    expect(frontendGroup?.kind === 'group' ? frontendGroup.x : 0).toBeLessThan(
      webApp?.kind === 'shape' ? webApp.x : 0,
    )
    expect(frontendGroup?.kind === 'group' ? frontendGroup.y : 0).toBeLessThan(
      webApp?.kind === 'shape' ? webApp.y : 0,
    )
    expect(frontendGroup?.kind === 'group' ? frontendGroup.x + frontendGroup.width : 0).toBeGreaterThan(
      mobile?.kind === 'shape' ? mobile.x + mobile.width : 0,
    )
  })

  it('undoes a generated diagram as one macro command', () => {
    const manager = new CommandManager(createProjectState('画布'))
    const plan = createLocalTemplatePlan('请画一个用户注册登录流程图')

    manager.execute(
      buildPlanCommand(plan, {
        layoutEngine: new FixedLayoutEngine(),
        timestamp: 30,
      }),
    )

    expect(manager.getUndoCount()).toBe(1)
    expect(Object.keys(manager.getState().elements).length).toBeGreaterThan(1)

    manager.undo()

    expect(manager.getUndoCount()).toBe(0)
    expect(manager.getState().elementOrder).toEqual([])
  })

  it('throws before building a command for invalid plans', () => {
    const invalidPlan: AgentPlan = {
      id: 'invalid',
      summary: 'Invalid plan',
      requiresConfirmation: true,
      operations: [
        {
          id: 'connect-missing',
          type: 'create-connector',
          elementId: 'missing-edge',
          fromId: 'missing-a',
          toId: 'missing-b',
        },
      ],
      layoutIntent: { type: 'flow', mode: 'global', direction: 'LR' },
      speechFeedback: 'Invalid',
    }

    expect(() => buildPlanCommand(invalidPlan)).toThrow(
      'Invalid AgentPlan: Operation connect-missing references missing element: missing-a',
    )
  })

  it('applies text, style, move, delete, and relayout operations', () => {
    const layoutEngine = new FixedLayoutEngine()
    const initialState = addElement(createProjectState('画布'), shape('existing-node'))
    const manager = new CommandManager(initialState)
    const plan: AgentPlan = {
      id: 'mixed-ops',
      summary: 'Mixed operations',
      requiresConfirmation: true,
      operations: [
        {
          id: 'create-note',
          type: 'create-text',
          elementId: 'note',
          text: '复盘重点',
          label: '说明',
          style: { textColor: '#171717' },
        },
        {
          id: 'update-existing',
          type: 'update-style',
          elementId: 'existing-node',
          style: { fill: '#d3e5ff' },
        },
        {
          id: 'move-existing',
          type: 'move-element',
          elementId: 'existing-node',
          dx: 20,
          dy: 30,
        },
        {
          id: 'relayout-existing',
          type: 'relayout-region',
          elementIds: ['existing-node'],
          layoutIntent: { type: 'grid', mode: 'global' },
        },
        {
          id: 'delete-note',
          type: 'delete-element',
          elementId: 'note',
        },
      ],
      layoutIntent: { type: 'grid', mode: 'global' },
      speechFeedback: 'Mixed operations',
    }

    manager.execute(
      buildPlanCommand(plan, {
        existingElementIds: ['existing-node'],
        layoutEngine,
        timestamp: 40,
      }),
    )

    const state = manager.getState()
    expect(state.elements.note).toBeUndefined()
    expect(state.elements['existing-node']).toMatchObject({
      style: { fill: '#d3e5ff' },
      x: 100,
      y: 80,
      meta: { updatedAt: 40 },
    })
    expect(layoutEngine.requests).toHaveLength(2)
  })
})

function shape(id: string): ShapeElement {
  return {
    id,
    kind: 'shape',
    shape: 'rounded-rect',
    label: id,
    x: 10,
    y: 15,
    width: 160,
    height: 72,
    meta: {
      source: 'template',
      createdAt: 1,
      updatedAt: 1,
    },
  }
}
