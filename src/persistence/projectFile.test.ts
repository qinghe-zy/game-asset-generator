import { describe, expect, it } from 'vitest'
import { createProjectState } from '../state/projectState'
import {
  createProjectExport,
  parseProjectImport,
  projectExportFileName,
} from './projectFile'

describe('projectFile', () => {
  it('creates a versioned export payload and readable file name', () => {
    const state = createProjectState('用户注册登录流程图')

    expect(createProjectExport(state)).toMatchObject({
      format: 'voice-canvas-project',
      version: 1,
      project: state,
    })
    expect(projectExportFileName(state, new Date('2026-06-14T10:20:30Z')))
      .toBe('用户注册登录流程图-2026-06-14.voicecanvas.json')
  })

  it('parses valid project JSON and rejects invalid imports', () => {
    const state = createProjectState('Imported')
    const validJson = JSON.stringify(createProjectExport(state))

    expect(parseProjectImport(validJson)).toEqual({
      ok: true,
      project: state,
    })
    expect(parseProjectImport('{bad json')).toMatchObject({
      ok: false,
      message: '项目文件不是有效 JSON',
    })
    expect(parseProjectImport(JSON.stringify({ version: 99, project: state })))
      .toMatchObject({
        ok: false,
      })
  })
})
