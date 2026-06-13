import type {
  AgentPlan,
  CreateConnectorOperation,
  CreateGroupOperation,
  CreateShapeOperation,
  LayoutIntent,
  PlanOperation,
} from './AgentPlan'

export interface LocalTemplatePlanInput {
  prompt: string
}

interface TemplateNode {
  id: string
  label: string
  shape?: CreateShapeOperation['shape']
  parentId?: string
  fill?: string
}

interface TemplateGroup {
  id: string
  label: string
  childIds: string[]
  fill?: string
}

interface TemplateSpec {
  kind: string
  summary: string
  speechFeedback: string
  layoutIntent: LayoutIntent
  nodes: TemplateNode[]
  connectors: Array<{
    fromId: string
    toId: string
    label?: string
  }>
  groups?: TemplateGroup[]
  fallbackReason?: string | null
}

const nodeStyle = (fill = '#ffffff') => ({
  fill,
  stroke: '#171717',
  textColor: fill === '#171717' ? '#ffffff' : '#171717',
  strokeWidth: 1,
})

const connectorStyle = {
  stroke: '#4d4d4d',
  textColor: '#4d4d4d',
  strokeWidth: 1,
}

export function createLocalTemplatePlan(
  input: string | LocalTemplatePlanInput,
): AgentPlan {
  const prompt = normalizePrompt(typeof input === 'string' ? input : input.prompt)
  const spec = selectTemplate(prompt)
  const operations = buildOperations(spec)

  return {
    id: `local-template-${spec.kind}-${slugify(prompt).slice(0, 32)}`,
    summary: spec.summary,
    requiresConfirmation: true,
    operations,
    layoutIntent: spec.layoutIntent,
    speechFeedback: spec.speechFeedback,
    riskFlags: [],
    fallbackReason: spec.fallbackReason ?? null,
  }
}

function selectTemplate(prompt: string): TemplateSpec {
  if (matches(prompt, ['架构', '系统', '前端', '后端', '数据库', '服务'])) {
    return architectureTemplate()
  }

  if (matches(prompt, ['思维导图', '脑图', '头脑风暴', '主题'])) {
    return mindMapTemplate(prompt)
  }

  if (matches(prompt, ['故事', '剧情', '剧本', '用户旅程', '旅程'])) {
    return storyMapTemplate()
  }

  if (matches(prompt, ['关系', '利益相关', '角色关系', '生态', '人群'])) {
    return relationshipMapTemplate()
  }

  if (matches(prompt, ['聚会', '旅行', '活动', '派对', '游戏', '娱乐', '周末'])) {
    return planningTemplate()
  }

  if (matches(prompt, ['流程', '注册', '登录', '审批', '订单', '支付'])) {
    return flowTemplate()
  }

  return fallbackTemplate(prompt)
}

function flowTemplate(): TemplateSpec {
  const nodes: TemplateNode[] = [
    { id: 'flow-entry', label: '打开入口', shape: 'rounded-rect', fill: '#d3e5ff' },
    { id: 'flow-account', label: '输入账号', shape: 'rounded-rect' },
    { id: 'flow-verify', label: '短信验证码', shape: 'diamond', fill: '#ffefcf' },
    { id: 'flow-profile', label: '完善资料', shape: 'rounded-rect' },
    { id: 'flow-home', label: '进入首页', shape: 'rounded-rect', fill: '#aaffec' },
    { id: 'flow-error', label: '异常提示', shape: 'sticky-note', fill: '#f7d4d6' },
  ]

  return {
    kind: 'flow',
    summary: '创建注册登录流程，包含验证码、成功路径和异常处理。',
    speechFeedback: '我会生成一张注册登录流程图，先等待你确认后执行。',
    layoutIntent: { type: 'flow', mode: 'global', direction: 'LR' },
    nodes,
    connectors: [
      { fromId: 'flow-entry', toId: 'flow-account', label: '开始' },
      { fromId: 'flow-account', toId: 'flow-verify', label: '提交' },
      { fromId: 'flow-verify', toId: 'flow-profile', label: '验证通过' },
      { fromId: 'flow-profile', toId: 'flow-home', label: '完成' },
      { fromId: 'flow-verify', toId: 'flow-error', label: '失败/超时' },
    ],
  }
}

function architectureTemplate(): TemplateSpec {
  const groups: TemplateGroup[] = [
    {
      id: 'architecture-frontend',
      label: '前端体验层',
      childIds: ['architecture-web-app', 'architecture-mobile'],
      fill: '#fafafa',
    },
    {
      id: 'architecture-backend',
      label: '业务服务层',
      childIds: ['architecture-api-gateway', 'architecture-business-service'],
      fill: '#f5f5f5',
    },
    {
      id: 'architecture-data',
      label: '数据与外部能力',
      childIds: ['architecture-database', 'architecture-observability', 'architecture-third-party'],
      fill: '#fafafa',
    },
  ]
  const nodes: TemplateNode[] = [
    {
      id: 'architecture-web-app',
      label: 'Web 应用',
      parentId: 'architecture-frontend',
      fill: '#d3e5ff',
    },
    {
      id: 'architecture-mobile',
      label: '移动端/H5',
      parentId: 'architecture-frontend',
    },
    {
      id: 'architecture-api-gateway',
      label: 'API 网关',
      parentId: 'architecture-backend',
      fill: '#ffefcf',
    },
    {
      id: 'architecture-business-service',
      label: '业务服务',
      parentId: 'architecture-backend',
    },
    {
      id: 'architecture-database',
      label: '主数据库',
      shape: 'cylinder',
      parentId: 'architecture-data',
      fill: '#aaffec',
    },
    {
      id: 'architecture-observability',
      label: '监控告警',
      parentId: 'architecture-data',
    },
    {
      id: 'architecture-third-party',
      label: '短信/支付服务',
      parentId: 'architecture-data',
      fill: '#d8ccf1',
    },
  ]

  return {
    kind: 'architecture',
    summary: '创建三层架构图，覆盖前端、业务服务、数据和外部服务。',
    speechFeedback: '我会生成前端、后端、数据库和第三方服务之间的架构关系。',
    layoutIntent: { type: 'flow', mode: 'global', direction: 'LR' },
    groups,
    nodes,
    connectors: [
      {
        fromId: 'architecture-web-app',
        toId: 'architecture-api-gateway',
        label: 'HTTPS',
      },
      {
        fromId: 'architecture-mobile',
        toId: 'architecture-api-gateway',
        label: 'API 调用',
      },
      {
        fromId: 'architecture-api-gateway',
        toId: 'architecture-business-service',
        label: '路由',
      },
      {
        fromId: 'architecture-business-service',
        toId: 'architecture-database',
        label: '读写',
      },
      {
        fromId: 'architecture-business-service',
        toId: 'architecture-third-party',
        label: '集成',
      },
      {
        fromId: 'architecture-business-service',
        toId: 'architecture-observability',
        label: '日志/指标',
      },
    ],
  }
}

function mindMapTemplate(prompt: string): TemplateSpec {
  const rootLabel = prompt.includes('ai') || prompt.includes('语音绘图')
    ? 'AI 语音绘图工具'
    : '核心主题'
  const nodes: TemplateNode[] = [
    { id: 'mindmap-root', label: rootLabel, shape: 'rounded-rect', fill: '#171717' },
    { id: 'mindmap-voice', label: '语音输入', fill: '#d3e5ff' },
    { id: 'mindmap-agent', label: 'Agent 理解', fill: '#d8ccf1' },
    { id: 'mindmap-canvas', label: '画布执行', fill: '#aaffec' },
    { id: 'mindmap-confirm', label: '安全确认', fill: '#ffefcf' },
  ]

  return {
    kind: 'mindmap',
    summary: `创建围绕“${rootLabel}”的思维导图。`,
    speechFeedback: '我会把主题拆成输入、理解、执行和确认四个分支。',
    layoutIntent: { type: 'mindmap', mode: 'global' },
    nodes,
    connectors: nodes
      .slice(1)
      .map((node) => ({ fromId: 'mindmap-root', toId: node.id })),
  }
}

function storyMapTemplate(): TemplateSpec {
  return {
    kind: 'story',
    summary: '创建故事地图，组织角色、目标、冲突、转折和结局。',
    speechFeedback: '我会生成一张故事结构图，帮助你继续扩写剧情。',
    layoutIntent: { type: 'flow', mode: 'global', direction: 'LR' },
    nodes: [
      { id: 'story-world', label: '世界设定', fill: '#d3e5ff' },
      { id: 'story-character', label: '主角动机' },
      { id: 'story-trigger', label: '触发事件', fill: '#ffefcf' },
      { id: 'story-conflict', label: '核心冲突', shape: 'diamond', fill: '#f7d4d6' },
      { id: 'story-turning', label: '关键转折' },
      { id: 'story-ending', label: '结局余味', fill: '#aaffec' },
    ],
    connectors: [
      { fromId: 'story-world', toId: 'story-character' },
      { fromId: 'story-character', toId: 'story-trigger' },
      { fromId: 'story-trigger', toId: 'story-conflict' },
      { fromId: 'story-conflict', toId: 'story-turning' },
      { fromId: 'story-turning', toId: 'story-ending' },
    ],
  }
}

function relationshipMapTemplate(): TemplateSpec {
  return {
    kind: 'relationship',
    summary: '创建关系地图，区分核心对象、支持者、阻力和外部影响。',
    speechFeedback: '我会生成一张关系图，把关键角色和影响路径连起来。',
    layoutIntent: { type: 'mindmap', mode: 'global' },
    nodes: [
      { id: 'relationship-core', label: '核心对象', shape: 'circle', fill: '#171717' },
      { id: 'relationship-user', label: '主要用户', fill: '#d3e5ff' },
      { id: 'relationship-supporter', label: '支持者' },
      { id: 'relationship-risk', label: '阻力/风险', fill: '#f7d4d6' },
      { id: 'relationship-partner', label: '合作方', fill: '#aaffec' },
      { id: 'relationship-channel', label: '触达渠道', fill: '#ffefcf' },
    ],
    connectors: [
      { fromId: 'relationship-core', toId: 'relationship-user', label: '服务' },
      { fromId: 'relationship-core', toId: 'relationship-supporter', label: '协作' },
      { fromId: 'relationship-risk', toId: 'relationship-core', label: '影响' },
      { fromId: 'relationship-partner', toId: 'relationship-core', label: '补位' },
      { fromId: 'relationship-channel', toId: 'relationship-user', label: '触达' },
    ],
  }
}

function planningTemplate(): TemplateSpec {
  return {
    kind: 'planning',
    summary: '创建活动策划图，覆盖目标、流程、角色、物料、预算和风险。',
    speechFeedback: '我会把活动策划拆成可执行的模块，方便继续细化。',
    layoutIntent: { type: 'mindmap', mode: 'global' },
    nodes: [
      { id: 'planning-theme', label: '主题定位', fill: '#d3e5ff' },
      { id: 'planning-time-place', label: '时间地点' },
      { id: 'planning-roles', label: '角色分工', fill: '#d8ccf1' },
      { id: 'planning-flow', label: '互动环节', fill: '#ffefcf' },
      { id: 'planning-materials', label: '物料清单' },
      { id: 'planning-budget-risk', label: '预算与风险', fill: '#f7d4d6' },
    ],
    connectors: [
      { fromId: 'planning-theme', toId: 'planning-time-place', label: '落地' },
      { fromId: 'planning-theme', toId: 'planning-roles', label: '组织' },
      { fromId: 'planning-roles', toId: 'planning-flow', label: '推进' },
      { fromId: 'planning-flow', toId: 'planning-materials', label: '需要' },
      { fromId: 'planning-materials', toId: 'planning-budget-risk', label: '核算' },
    ],
  }
}

function fallbackTemplate(prompt: string): TemplateSpec {
  const rootLabel = prompt || '新的创作主题'
  const nodes: TemplateNode[] = [
    { id: 'fallback-root', label: rootLabel, shape: 'rounded-rect', fill: '#171717' },
    { id: 'fallback-goal', label: '目标', fill: '#d3e5ff' },
    { id: 'fallback-structure', label: '结构', fill: '#d8ccf1' },
    { id: 'fallback-details', label: '细节', fill: '#ffefcf' },
    { id: 'fallback-next', label: '下一步', fill: '#aaffec' },
  ]

  return {
    kind: 'fallback',
    summary: '创建通用创作拆解图，先把想法拆成目标、结构、细节和下一步。',
    speechFeedback: '我没有命中专门模板，会先生成一张通用创作拆解图。',
    layoutIntent: { type: 'mindmap', mode: 'global' },
    nodes,
    connectors: nodes
      .slice(1)
      .map((node) => ({ fromId: 'fallback-root', toId: node.id })),
    fallbackReason: '未命中专用本地模板，使用通用创作拆解模板。',
  }
}

function buildOperations(spec: TemplateSpec): PlanOperation[] {
  const groupOperations = (spec.groups ?? []).map(createGroupOperation)
  const nodeOperations = spec.nodes.map(createShapeOperation)
  const connectorOperations = spec.connectors.map((connector, index) =>
    createConnectorOperation(spec.kind, connector, index),
  )

  return [...groupOperations, ...nodeOperations, ...connectorOperations]
}

function createGroupOperation(group: TemplateGroup): CreateGroupOperation {
  return {
    id: `create-${group.id}`,
    type: 'create-group',
    elementId: group.id,
    label: group.label,
    childIds: group.childIds,
    style: nodeStyle(group.fill),
  }
}

function createShapeOperation(node: TemplateNode): CreateShapeOperation {
  return {
    id: `create-${node.id}`,
    type: 'create-shape',
    elementId: node.id,
    shape: node.shape ?? 'rounded-rect',
    label: node.label,
    parentId: node.parentId,
    style: nodeStyle(node.fill),
  }
}

function createConnectorOperation(
  kind: string,
  connector: TemplateSpec['connectors'][number],
  index: number,
): CreateConnectorOperation {
  return {
    id: `connect-${kind}-${index + 1}`,
    type: 'create-connector',
    elementId: `connector-${kind}-${index + 1}`,
    fromId: connector.fromId,
    toId: connector.toId,
    label: connector.label,
    routing: 'orthogonal',
    style: connectorStyle,
  }
}

function normalizePrompt(prompt: string): string {
  return prompt.trim().replace(/\s+/g, ' ').toLowerCase()
}

function matches(prompt: string, keywords: string[]): boolean {
  return keywords.some((keyword) => prompt.includes(keyword.toLowerCase()))
}

function slugify(value: string): string {
  const ascii = value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()

  if (ascii) {
    return ascii
  }

  let hash = 0
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }

  return `prompt-${hash.toString(36)}`
}
