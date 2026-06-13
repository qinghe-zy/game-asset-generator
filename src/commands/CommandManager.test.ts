import { describe, expect, it } from 'vitest'
import { CommandManager, createMacroCommand } from './CommandManager'
import { addElement, createProjectState, updateElement } from '../state/projectState'
import type { ProjectState } from '../state/projectState'
import type { ShapeElement } from '../state/elements'

const shape = (id: string): ShapeElement => ({
  id,
  kind: 'shape',
  shape: 'rounded-rect',
  label: id,
  x: 0,
  y: 0,
  width: 120,
  height: 60,
  meta: {
    source: 'template',
    createdAt: 1,
    updatedAt: 1,
  },
})

describe('CommandManager', () => {
  it('executes a command and undoes it with a snapshot', () => {
    const manager = new CommandManager(createProjectState('画布'))

    manager.execute({
      id: 'add-login',
      label: 'Add login',
      apply: (state) => addElement(state, shape('login')),
    })

    expect(manager.getState().elements.login?.label).toBe('login')

    manager.undo()

    expect(manager.getState().elements.login).toBeUndefined()

    manager.redo()

    expect(manager.getState().elements.login?.label).toBe('login')
  })

  it('treats a macro command as one undo step', () => {
    const manager = new CommandManager(createProjectState('画布'))
    const macro = createMacroCommand('macro-1', 'Create login flow', [
      {
        id: 'add-login',
        label: 'Add login',
        apply: (state: ProjectState) => addElement(state, shape('login')),
      },
      {
        id: 'rename-login',
        label: 'Rename login',
        apply: (state: ProjectState) =>
          updateElement(state, 'login', { label: '用户登录' }),
      },
    ])

    manager.execute(macro)

    expect(manager.getState().elements.login?.label).toBe('用户登录')
    expect(manager.getUndoCount()).toBe(1)

    manager.undo()

    expect(manager.getState().elements.login).toBeUndefined()
    expect(manager.getRedoCount()).toBe(1)
  })

  it('clears redo history after a new command', () => {
    const manager = new CommandManager(createProjectState('画布'))

    manager.execute({
      id: 'add-login',
      label: 'Add login',
      apply: (state) => addElement(state, shape('login')),
    })
    manager.undo()
    manager.execute({
      id: 'add-register',
      label: 'Add register',
      apply: (state) => addElement(state, shape('register')),
    })

    expect(manager.getRedoCount()).toBe(0)
    expect(manager.getState().elements.register?.label).toBe('register')
  })
})
