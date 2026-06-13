import type { ProjectState } from '../state/projectState'

declare global {
  interface Window {
    getProjectState?: () => ProjectState
  }
}

type ProjectStateGetter = () => ProjectState

let activeGetter: ProjectStateGetter | undefined

export function registerProjectStateDebug(
  getProjectState: ProjectStateGetter,
): () => void {
  if (!isProjectStateDebugEnabled()) {
    return () => undefined
  }

  activeGetter = getProjectState
  window.getProjectState = getProjectState

  return () => {
    if (activeGetter === getProjectState) {
      clearProjectStateDebug()
    }
  }
}

export function clearProjectStateDebug(): void {
  activeGetter = undefined
  delete window.getProjectState
}

function isProjectStateDebugEnabled(): boolean {
  return import.meta.env.DEV || import.meta.env.MODE === 'test'
}
