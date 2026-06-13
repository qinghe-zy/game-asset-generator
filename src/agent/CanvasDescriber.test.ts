import { describe, expect, it } from 'vitest'
import { describeCanvas } from './CanvasDescriber'
import { addElement, createProjectState, selectElements } from '../state/projectState'
import type {
  ConnectorElement,
  GroupElement,
  ShapeElement,
} from '../state/elements'
import type { ProjectState } from '../state/projectState'

const shape = (
  id: string,
  label: string,
  parentId?: string,
): ShapeElement => ({
  id,
  kind: 'shape',
  shape: 'rounded-rect',
  label,
  parentId,
  x: 100,
  y: 200,
  width: 160,
  height: 72,
  style: {
    fill: '#ffffff',
    stroke: '#171717',
  },
  meta: {
    source: 'template',
    createdAt: 1,
    updatedAt: 1,
  },
})

const group = (id: string, label: string): GroupElement => ({
  id,
  kind: 'group',
  label,
  x: 80,
  y: 160,
  width: 520,
  height: 260,
  style: {
    fill: '#fafafa',
  },
  meta: {
    source: 'template',
    createdAt: 1,
    updatedAt: 1,
  },
})

const connector = (
  id: string,
  fromId: string,
  toId: string,
  label?: string,
): ConnectorElement => ({
  id,
  kind: 'connector',
  fromId,
  toId,
  label,
  meta: {
    source: 'template',
    createdAt: 1,
    updatedAt: 1,
  },
})

const withElements = (
  title: string,
  elements: Array<ShapeElement | GroupElement | ConnectorElement>,
): ProjectState =>
  elements.reduce(
    (state, element) => addElement(state, element),
    createProjectState(title),
  )

describe('CanvasDescriber', () => {
  it('includes title, version, element count, groups, and relations', () => {
    const state = withElements('AI 架构图', [
      group('group_frontend', '前端层'),
      shape('node_react', 'React', 'group_frontend'),
      shape('node_api', 'API 代理'),
      connector('edge_react_api', 'node_react', 'node_api', '调用'),
    ])

    const summary = describeCanvas(state)

    expect(summary.title).toBe('AI 架构图')
    expect(summary.version).toBe(state.version)
    expect(summary.elementCount).toBe(4)
    expect(summary.groups).toEqual([
      {
        id: 'group_frontend',
        label: '前端层',
        nodes: ['React'],
      },
    ])
    expect(summary.relations).toEqual([
      {
        id: 'edge_react_api',
        from: 'React',
        to: 'API 代理',
        label: '调用',
      },
    ])
  })

  it('includes selected IDs and recent changes from options', () => {
    const state = selectElements(
      withElements('流程图', [shape('node_login', '登录')]),
      ['node_login'],
    )

    const summary = describeCanvas(state, {
      recentChanges: ['新增 登录 节点'],
    })

    expect(summary.selectedIds).toEqual(['node_login'])
    expect(summary.recentChanges).toEqual(['新增 登录 节点'])
  })

  it('excludes raw style and coordinate details', () => {
    const state = withElements('流程图', [shape('node_login', '登录')])

    const serialized = JSON.stringify(describeCanvas(state))

    expect(serialized).not.toContain('"style"')
    expect(serialized).not.toContain('"x"')
    expect(serialized).not.toContain('"width"')
    expect(serialized).not.toContain('#171717')
  })

  it('limits node samples for a large canvas', () => {
    const elements = Array.from({ length: 30 }, (_, index) =>
      shape(`node_${index}`, `节点${index}`),
    )
    const state = withElements('大画布', elements)

    const summary = describeCanvas(state, { maxNodes: 5 })

    expect(summary.nodes).toHaveLength(5)
    expect(summary.truncatedNodeCount).toBe(25)
    expect(summary.nodes.map((nodeSummary) => nodeSummary.label)).toEqual([
      '节点0',
      '节点1',
      '节点2',
      '节点3',
      '节点4',
    ])
  })
})
