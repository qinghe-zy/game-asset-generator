import { describe, expect, it } from 'vitest'
import { createLocalTemplatePlan } from './LocalTemplateAgent'
import { validateAgentPlan } from './PlanValidator'
import type { AgentPlan, PlanOperation } from './AgentPlan'

const expectValidPlan = (plan: AgentPlan) => {
  const result = validateAgentPlan(plan)

  expect(result.ok, result.ok ? '' : result.errors.join('\n')).toBe(true)
}

const operationsOfType = <T extends PlanOperation['type']>(
  plan: AgentPlan,
  type: T,
) =>
  plan.operations.filter(
    (operation): operation is Extract<PlanOperation, { type: T }> =>
      operation.type === type,
  )

describe('LocalTemplateAgent', () => {
  it('creates a connected flowchart plan for registration and login requests', () => {
    const plan = createLocalTemplatePlan('请画一个用户注册登录流程图，包含验证码和异常处理')

    expectValidPlan(plan)
    expect(plan.layoutIntent).toMatchObject({ type: 'flow', direction: 'LR' })
    expect(plan.requiresConfirmation).toBe(true)
    expect(plan.fallbackReason).toBeNull()
    expect(plan.summary).toContain('注册登录流程')
    expect(operationsOfType(plan, 'create-shape').map((operation) => operation.label)).toEqual(
      expect.arrayContaining(['打开入口', '输入账号', '短信验证码', '进入首页']),
    )
    expect(operationsOfType(plan, 'create-connector')).toHaveLength(5)
  })

  it('creates grouped architecture plans with cross-layer connectors', () => {
    const plan = createLocalTemplatePlan('设计一个前端、后端、数据库和第三方服务的三层架构图')

    expectValidPlan(plan)
    expect(plan.layoutIntent).toMatchObject({ type: 'flow', direction: 'LR' })
    expect(operationsOfType(plan, 'create-group').map((operation) => operation.label)).toEqual(
      expect.arrayContaining(['前端体验层', '业务服务层', '数据与外部能力']),
    )
    expect(operationsOfType(plan, 'create-shape').map((operation) => operation.label)).toEqual(
      expect.arrayContaining(['Web 应用', 'API 网关', '业务服务', '主数据库', '短信/支付服务']),
    )
    expect(operationsOfType(plan, 'create-connector')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fromId: 'architecture-web-app', toId: 'architecture-api-gateway' }),
        expect.objectContaining({ fromId: 'architecture-business-service', toId: 'architecture-database' }),
      ]),
    )
  })

  it('creates a mind map plan with one root and multiple topic branches', () => {
    const plan = createLocalTemplatePlan('围绕 AI 语音绘图工具做一个思维导图')

    expectValidPlan(plan)
    expect(plan.layoutIntent).toMatchObject({ type: 'mindmap', mode: 'global' })
    expect(operationsOfType(plan, 'create-shape').map((operation) => operation.label)).toEqual(
      expect.arrayContaining(['AI 语音绘图工具', '语音输入', 'Agent 理解', '画布执行', '安全确认']),
    )
    expect(operationsOfType(plan, 'create-connector')).toHaveLength(4)
  })

  it('creates non-trivial entertainment planning maps for party requests', () => {
    const plan = createLocalTemplatePlan('帮我策划一个周末朋友聚会活动图，要有流程、角色和物料')

    expectValidPlan(plan)
    expect(plan.summary).toContain('活动策划')
    expect(operationsOfType(plan, 'create-shape').map((operation) => operation.label)).toEqual(
      expect.arrayContaining(['主题定位', '时间地点', '互动环节', '物料清单', '预算与风险']),
    )
    expect(operationsOfType(plan, 'create-shape').length).toBeGreaterThanOrEqual(6)
    expect(operationsOfType(plan, 'create-connector').length).toBeGreaterThanOrEqual(5)
  })

  it('returns a useful fallback plan with a reason for unmatched prompts', () => {
    const plan = createLocalTemplatePlan('随便来点灵感')

    expectValidPlan(plan)
    expect(plan.layoutIntent).toMatchObject({ type: 'mindmap' })
    expect(plan.fallbackReason).toContain('未命中')
    expect(operationsOfType(plan, 'create-shape').map((operation) => operation.label)).toEqual(
      expect.arrayContaining(['随便来点灵感', '目标', '结构', '细节', '下一步']),
    )
  })
})
