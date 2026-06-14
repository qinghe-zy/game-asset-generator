import { describe, expect, it } from 'vitest'
import { parsePlanRequest } from './schema'

describe('agent API schema', () => {
  it('accepts a compact planning request', () => {
    const parsed = parsePlanRequest({
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
      existingElementIds: ['node-a'],
    })

    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.request.prompt).toBe('画一个登录流程图')
      expect(parsed.request.existingElementIds).toEqual(['node-a'])
    }
  })

  it('rejects missing or oversized prompt values', () => {
    expect(parsePlanRequest({ prompt: '' })).toMatchObject({
      ok: false,
      status: 400,
    })
    expect(parsePlanRequest({ prompt: 'x'.repeat(2001) })).toMatchObject({
      ok: false,
      status: 413,
    })
  })
})
