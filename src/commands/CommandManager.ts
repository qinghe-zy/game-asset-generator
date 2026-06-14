import type { ProjectState } from '../state/projectState'

export interface Command {
  id: string
  label: string
  apply(state: ProjectState): ProjectState
}

interface HistoryEntry {
  command: Command
  before: ProjectState
  after: ProjectState
}

export function createMacroCommand(
  id: string,
  label: string,
  commands: Command[],
): Command {
  return {
    id,
    label,
    apply(state) {
      return commands.reduce(
        (currentState, command) => command.apply(currentState),
        state,
      )
    },
  }
}

export class CommandManager {
  private state: ProjectState
  private undoStack: HistoryEntry[] = []
  private redoStack: HistoryEntry[] = []

  constructor(initialState: ProjectState) {
    this.state = initialState
  }

  getState(): ProjectState {
    return this.state
  }

  getUndoCount(): number {
    return this.undoStack.length
  }

  getRedoCount(): number {
    return this.redoStack.length
  }

  reset(state: ProjectState): ProjectState {
    this.state = state
    this.undoStack = []
    this.redoStack = []

    return this.state
  }

  execute(command: Command): ProjectState {
    const before = this.state
    const after = command.apply(before)

    this.state = after
    this.undoStack.push({ command, before, after })
    this.redoStack = []

    return this.state
  }

  undo(): ProjectState {
    const entry = this.undoStack.pop()

    if (!entry) {
      return this.state
    }

    this.state = entry.before
    this.redoStack.push(entry)

    return this.state
  }

  redo(): ProjectState {
    const entry = this.redoStack.pop()

    if (!entry) {
      return this.state
    }

    this.state = entry.after
    this.undoStack.push(entry)

    return this.state
  }
}
