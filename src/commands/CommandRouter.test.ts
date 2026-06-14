import { describe, expect, it, vi } from 'vitest'
import { addElement, createProjectState, selectElements } from '../state/projectState'
import type { ConnectorElement, ShapeElement } from '../state/elements'
import type { ProjectState } from '../state/projectState'
import { routeLocalCommand, type LocalCommandResult } from './CommandRouter'

const node = (id: string, label: string): ShapeElement => ({
  id,
  kind: 'shape',
  shape: 'rounded-rect',
  label,
  x: 0,
  y: 0,
  width: 120,
  height: 60,
  style: {
    fill: '#ffffff',
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
): ConnectorElement => ({
  id,
  kind: 'connector',
  fromId,
  toId,
  meta: {
    source: 'template',
    createdAt: 1,
    updatedAt: 1,
  },
})

const withNodes = (...elements: ShapeElement[]): ProjectState =>
  elements.reduce(
    (state, element) => addElement(state, element),
    createProjectState('画布'),
  )

function expectHandled(result: LocalCommandResult) {
  expect(result.status).toBe('handled')

  if (result.status !== 'handled') {
    throw new Error(`Expected handled result, received ${result.status}`)
  }

  return result
}

function expectClarification(result: LocalCommandResult) {
  expect(result.status).toBe('clarification')

  if (result.status !== 'clarification') {
    throw new Error(`Expected clarification result, received ${result.status}`)
  }

  return result
}

function expectUnsupported(result: LocalCommandResult) {
  expect(result.status).toBe('unsupported')

  if (result.status !== 'unsupported') {
    throw new Error(`Expected unsupported result, received ${result.status}`)
  }

  return result
}

function expectExport(result: LocalCommandResult) {
  expect(result.status).toBe('export')

  if (result.status !== 'export') {
    throw new Error(`Expected export result, received ${result.status}`)
  }

  return result
}

describe('CommandRouter', () => {
  it('routes undo to the supplied callback', () => {
    const undo = vi.fn(() => withNodes(node('login', '登录')))

    const result = routeLocalCommand('撤销', {
      state: createProjectState('画布'),
      undo,
      redo: vi.fn(),
      execute: vi.fn(),
    })

    const handled = expectHandled(result)

    expect(undo).toHaveBeenCalledTimes(1)
    expect(handled.state.elements.login?.label).toBe('登录')
  })

  it('does not report undo as handled when no undo history exists', () => {
    const undo = vi.fn(() => createProjectState('画布'))

    const result = routeLocalCommand('撤销', {
      state: createProjectState('画布'),
      canUndo: false,
      undo,
      redo: vi.fn(),
      execute: vi.fn(),
    })

    const unsupported = expectUnsupported(result)

    expect(unsupported.message).toBe('当前没有可撤销的操作')
    expect(undo).not.toHaveBeenCalled()
  })

  it('routes redo to the supplied callback', () => {
    const redo = vi.fn(() => withNodes(node('login', '登录')))

    const result = routeLocalCommand('重做', {
      state: createProjectState('画布'),
      undo: vi.fn(),
      redo,
      execute: vi.fn(),
    })

    const handled = expectHandled(result)

    expect(redo).toHaveBeenCalledTimes(1)
    expect(handled.state.elements.login?.label).toBe('登录')
  })

  it('does not report redo as handled when no redo history exists', () => {
    const redo = vi.fn(() => createProjectState('画布'))

    const result = routeLocalCommand('重做', {
      state: createProjectState('画布'),
      canRedo: false,
      undo: vi.fn(),
      redo,
      execute: vi.fn(),
    })

    const unsupported = expectUnsupported(result)

    expect(unsupported.message).toBe('当前没有可重做的操作')
    expect(redo).not.toHaveBeenCalled()
  })

  it('clears the canvas as one command', () => {
    const state = selectElements(
      withNodes(node('login', '登录'), node('register', '注册')),
      ['login'],
    )
    const execute = vi.fn((command) => command.apply(state))

    const result = routeLocalCommand('清空画布', {
      state,
      undo: vi.fn(),
      redo: vi.fn(),
      execute,
    })

    const handled = expectHandled(result)

    expect(execute).toHaveBeenCalledTimes(1)
    expect(handled.state.elementOrder).toEqual([])
    expect(handled.state.selectedIds).toEqual([])
  })

  it('deletes selected elements as one command', () => {
    const state = selectElements(
      withNodes(node('login', '登录'), node('register', '注册')),
      ['login'],
    )
    const execute = vi.fn((command) => command.apply(state))

    const result = routeLocalCommand('删除选中', {
      state,
      undo: vi.fn(),
      redo: vi.fn(),
      execute,
    })

    const handled = expectHandled(result)

    expect(execute).toHaveBeenCalledTimes(1)
    expect(handled.state.elements.login).toBeUndefined()
    expect(handled.state.elements.register?.label).toBe('注册')
    expect(handled.state.selectedIds).toEqual([])
  })

  it('deletes connectors attached to selected elements', () => {
    const state = selectElements(
      [node('login', '登录'), node('register', '注册'), connector('edge', 'login', 'register')].reduce(
        (currentState, element) => addElement(currentState, element),
        createProjectState('画布'),
      ),
      ['login'],
    )
    const execute = vi.fn((command) => command.apply(state))

    const result = routeLocalCommand('删除选中', {
      state,
      undo: vi.fn(),
      redo: vi.fn(),
      execute,
    })

    const handled = expectHandled(result)

    expect(handled.state.elements.login).toBeUndefined()
    expect(handled.state.elements.edge).toBeUndefined()
    expect(handled.state.elements.register?.label).toBe('注册')
  })

  it('recolors an unambiguous target using EntityResolver', () => {
    const state = withNodes(node('login', '登录'), node('register', '注册'))
    const execute = vi.fn((command) => command.apply(state))

    const result = routeLocalCommand('把登录改成红色', {
      state,
      undo: vi.fn(),
      redo: vi.fn(),
      execute,
    })

    const handled = expectHandled(result)

    expect(execute).toHaveBeenCalledTimes(1)
    expect(handled.state.elements.login?.style?.fill).toBe('#ef4444')
    expect(handled.state.elements.register?.style?.fill).toBe('#ffffff')
  })

  it('asks for clarification when the color target is ambiguous', () => {
    const state = withNodes(node('node_a', '服务A'), node('node_b', '服务B'))
    const execute = vi.fn()

    const result = routeLocalCommand('把服务改成蓝色', {
      state,
      undo: vi.fn(),
      redo: vi.fn(),
      execute,
    })

    const clarification = expectClarification(result)

    expect(clarification.candidateIds).toEqual(['node_a', 'node_b'])
    expect(execute).not.toHaveBeenCalled()
  })

  it('routes export commands without mutating the canvas', () => {
    const execute = vi.fn()

    const pngResult = routeLocalCommand('导出 PNG', {
      state: createProjectState('画布'),
      undo: vi.fn(),
      redo: vi.fn(),
      execute,
    })
    const jsonResult = routeLocalCommand('导出项目', {
      state: createProjectState('画布'),
      undo: vi.fn(),
      redo: vi.fn(),
      execute,
    })

    const pngExport = expectExport(pngResult)
    const jsonExport = expectExport(jsonResult)

    expect(pngExport.format).toBe('png')
    expect(jsonExport.format).toBe('json')
    expect(execute).not.toHaveBeenCalled()
  })

  it('leaves creative prompts for the Agent pipeline', () => {
    const execute = vi.fn()

    const result = routeLocalCommand('画一个用户注册登录流程图', {
      state: createProjectState('画布'),
      undo: vi.fn(),
      redo: vi.fn(),
      execute,
    })

    expect(result.status).toBe('not-local')
    expect(execute).not.toHaveBeenCalled()
  })
})
