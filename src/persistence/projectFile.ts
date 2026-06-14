import type { ProjectState } from '../state/projectState'
import { isProjectState } from './projectStorage'

export interface ProjectExportPayload {
  format: 'voice-canvas-project'
  version: 1
  exportedAt: string
  project: ProjectState
}

export type ProjectImportResult =
  | { ok: true; project: ProjectState }
  | { ok: false; message: string }

export function createProjectExport(
  project: ProjectState,
  exportedAt = new Date(),
): ProjectExportPayload {
  return {
    format: 'voice-canvas-project',
    version: 1,
    exportedAt: exportedAt.toISOString(),
    project,
  }
}

export function parseProjectImport(json: string): ProjectImportResult {
  let parsed: unknown

  try {
    parsed = JSON.parse(json)
  } catch {
    return { ok: false, message: '项目文件不是有效 JSON' }
  }

  if (!isProjectExportPayload(parsed)) {
    return { ok: false, message: '项目文件格式或版本不受支持' }
  }

  return { ok: true, project: parsed.project }
}

export function projectExportFileName(
  project: ProjectState,
  now = new Date(),
): string {
  const safeTitle = project.title
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 48) || 'voice-canvas-project'
  const date = now.toISOString().slice(0, 10)

  return `${safeTitle}-${date}.voicecanvas.json`
}

function isProjectExportPayload(value: unknown): value is ProjectExportPayload {
  if (!value || typeof value !== 'object') {
    return false
  }

  const payload = value as Partial<ProjectExportPayload>

  return (
    payload.format === 'voice-canvas-project' &&
    payload.version === 1 &&
    typeof payload.exportedAt === 'string' &&
    isProjectState(payload.project)
  )
}
