import type { ProjectState } from '../state/projectState'

export const PROJECT_STORAGE_KEY = 'voice-canvas-project-state'

export function saveProjectState(state: ProjectState): void {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(state))
}

export function loadStoredProjectState(): ProjectState | null {
  if (typeof localStorage === 'undefined') {
    return null
  }

  const storedState = localStorage.getItem(PROJECT_STORAGE_KEY)

  if (!storedState) {
    return null
  }

  try {
    const parsed = JSON.parse(storedState) as unknown
    return isProjectState(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function isProjectState(value: unknown): value is ProjectState {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<ProjectState>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.version === 'number' &&
    typeof candidate.elements === 'object' &&
    candidate.elements !== null &&
    Array.isArray(candidate.elementOrder) &&
    candidate.elementOrder.every((id) => typeof id === 'string') &&
    Array.isArray(candidate.selectedIds) &&
    candidate.selectedIds.every((id) => typeof id === 'string') &&
    typeof candidate.createdAt === 'number' &&
    typeof candidate.updatedAt === 'number'
  )
}
