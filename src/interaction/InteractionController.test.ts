import { describe, expect, it } from 'vitest'
import {
  InteractionController,
  type PendingPlan,
  type Planner,
} from './InteractionController'
import { addElement, createProjectState } from '../state/projectState'
import type { ShapeElement } from '../state/elements'

const shape = (id: string): ShapeElement => ({
  id,
  kind: 'shape',
  shape: 'rounded-rect',
  label: id,
  x: 0,
  y: 0,
  width: 100,
  height: 60,
  meta: {
    source: 'template',
    createdAt: 1,
    updatedAt: 1,
  },
})

describe('InteractionController', () => {
  it('creates a pending plan when state version is unchanged', async () => {
    const planner: Planner = async () => ({
      id: 'plan-1',
      summary: '创建登录流程',
      baseVersion: 1,
      requiresConfirmation: true,
    })
    const controller = new InteractionController(createProjectState('画布'), planner)

    const result = await controller.requestPlan('画登录流程')

    expect(result.status).toBe('pending')
    expect(controller.getPendingPlan()?.summary).toBe('创建登录流程')
  })

  it('marks a returned plan stale when project version changed during planning', async () => {
    let resolvePlan: (plan: PendingPlan) => void = () => undefined
    const planner: Planner = () =>
      new Promise((resolve) => {
        resolvePlan = resolve
      })
    const controller = new InteractionController(createProjectState('画布'), planner)

    const planning = controller.requestPlan('画登录流程')
    controller.applyExternalState((state) => addElement(state, shape('login')))
    resolvePlan({
      id: 'plan-1',
      summary: '创建登录流程',
      baseVersion: 1,
      requiresConfirmation: true,
    })

    const result = await planning

    expect(result.status).toBe('stale')
    expect(controller.getPendingPlan()).toBeNull()
  })

  it('aborts the active request when canceled', async () => {
    const signalFromPlanner: { current: AbortSignal | null } = { current: null }
    const planner: Planner = (_input, context) =>
      new Promise((_resolve, reject) => {
        signalFromPlanner.current = context.signal
        context.signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
    const controller = new InteractionController(createProjectState('画布'), planner)

    const planning = controller.requestPlan('画登录流程')
    controller.cancelActiveRequest()
    const result = await planning

    expect(signalFromPlanner.current?.aborted).toBe(true)
    expect(result.status).toBe('aborted')
  })
})
