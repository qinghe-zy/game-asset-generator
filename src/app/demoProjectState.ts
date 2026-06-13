import { addElement, createProjectState } from '../state/projectState'
import type { CanvasElement } from '../state/elements'

const demoMeta = {
  source: 'template' as const,
  createdAt: 1,
  updatedAt: 1,
}

export function createDemoProjectState() {
  const elements: CanvasElement[] = [
    {
      id: 'demo-group',
      kind: 'group',
      label: 'Voice planning area',
      x: 72,
      y: 64,
      width: 308,
      height: 176,
      style: {
        fill: '#f8fafc',
        stroke: '#d9e2e8',
        strokeWidth: 1,
        textColor: '#5d6b78',
        fontSize: 13,
      },
      meta: demoMeta,
    },
    {
      id: 'voice-brief',
      kind: 'shape',
      shape: 'rounded-rect',
      label: 'Voice brief',
      parentId: 'demo-group',
      x: 96,
      y: 88,
      width: 240,
      height: 116,
      style: {
        fill: '#f3fbf7',
        stroke: '#18735d',
        strokeWidth: 2,
      },
      meta: demoMeta,
    },
    {
      id: 'voice-brief-label',
      kind: 'text',
      text: 'Describe a drawing by voice',
      parentId: 'demo-group',
      x: 122,
      y: 125,
      width: 188,
      style: {
        textColor: '#133d34',
        fontSize: 18,
        fontWeight: 'bold',
      },
      meta: demoMeta,
    },
    {
      id: 'agent-plan',
      kind: 'shape',
      shape: 'rounded-rect',
      label: 'Agent plan',
      parentId: 'demo-group',
      x: 392,
      y: 88,
      width: 220,
      height: 116,
      style: {
        fill: '#f7f7f7',
        stroke: '#171717',
        strokeWidth: 2,
      },
      meta: demoMeta,
    },
    {
      id: 'voice-to-plan',
      kind: 'connector',
      fromId: 'voice-brief',
      toId: 'agent-plan',
      label: 'plans',
      style: {
        stroke: '#64748b',
        strokeWidth: 2,
        textColor: '#334155',
        fontSize: 12,
      },
      meta: demoMeta,
    },
  ]

  return elements.reduce(
    (state, element) => addElement(state, element),
    createProjectState('Voice Canvas demo'),
  )
}
