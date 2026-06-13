import type { CanvasElement } from './elements'

export interface ProjectState {
  id: string
  title: string
  version: number
  elements: Record<string, CanvasElement>
  elementOrder: string[]
  selectedIds: string[]
  createdAt: number
  updatedAt: number
}

const now = () => Date.now()

export function createProjectState(title: string): ProjectState {
  const timestamp = now()

  return {
    id: `project_${timestamp}`,
    title,
    version: 1,
    elements: {},
    elementOrder: [],
    selectedIds: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function addElement(
  state: ProjectState,
  element: CanvasElement,
): ProjectState {
  if (state.elements[element.id]) {
    throw new Error(`Element already exists: ${element.id}`)
  }

  return {
    ...state,
    version: state.version + 1,
    elements: {
      ...state.elements,
      [element.id]: element,
    },
    elementOrder: [...state.elementOrder, element.id],
    updatedAt: now(),
  }
}

export type ElementPatch = Partial<CanvasElement> & Record<string, unknown>

export function updateElement(
  state: ProjectState,
  elementId: string,
  patch: ElementPatch,
): ProjectState {
  const current = state.elements[elementId]

  if (!current) {
    throw new Error(`Element not found: ${elementId}`)
  }

  return {
    ...state,
    version: state.version + 1,
    elements: {
      ...state.elements,
      [elementId]: {
        ...current,
        ...patch,
      } as CanvasElement,
    },
    updatedAt: now(),
  }
}

export function removeElement(
  state: ProjectState,
  elementId: string,
): ProjectState {
  if (!state.elements[elementId]) {
    throw new Error(`Element not found: ${elementId}`)
  }

  const remainingElements = { ...state.elements }
  delete remainingElements[elementId]

  return {
    ...state,
    version: state.version + 1,
    elements: remainingElements,
    elementOrder: state.elementOrder.filter((id) => id !== elementId),
    selectedIds: state.selectedIds.filter((id) => id !== elementId),
    updatedAt: now(),
  }
}

export function selectElements(
  state: ProjectState,
  selectedIds: string[],
): ProjectState {
  const missingId = selectedIds.find((id) => !state.elements[id])

  if (missingId) {
    throw new Error(`Element not found: ${missingId}`)
  }

  return {
    ...state,
    version: state.version + 1,
    selectedIds,
    updatedAt: now(),
  }
}
