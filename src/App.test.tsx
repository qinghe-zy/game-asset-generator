import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

let root: Root | null = null
let container: HTMLDivElement | null = null

afterEach(() => {
  if (root) {
    act(() => {
      root?.unmount()
    })
  }

  container?.remove()
  root = null
  container = null
  vi.restoreAllMocks()
})

function renderApp() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)

  act(() => {
    root?.render(<App />)
  })

  return container
}

function changeInput(input: HTMLInputElement, value: string) {
  act(() => {
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set

    valueSetter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function click(button: HTMLButtonElement) {
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

describe('App pending plan runtime', () => {
  it('provides keyboard landmarks and accessible fallback controls', () => {
    const screen = renderApp()
    const skipLink = screen.querySelector<HTMLAnchorElement>(
      'a[href="#voice-canvas-workspace"]',
    )
    const workspace = screen.querySelector<HTMLElement>(
      '#voice-canvas-workspace',
    )
    const voiceForm = screen.querySelector<HTMLFormElement>(
      'form[aria-label="文本调试命令"]',
    )

    expect(skipLink).not.toBeNull()
    expect(skipLink?.textContent).toContain('跳到画布')
    expect(workspace).not.toBeNull()
    expect(workspace?.getAttribute('tabindex')).toBe('-1')
    expect(voiceForm).not.toBeNull()
    expect(
      screen.querySelector<HTMLInputElement>('input[aria-label="文本兼容输入"]'),
    ).not.toBeNull()
    expect(
      screen.querySelector<HTMLButtonElement>(
        'button[aria-label="提交文本命令生成计划"]',
      ),
    ).not.toBeNull()
    expect(
      screen.querySelector<HTMLButtonElement>('button[aria-label="撤销上一步"]'),
    ).not.toBeNull()
    expect(
      screen.querySelector<HTMLButtonElement>('button[aria-label="重做上一步"]'),
    ).not.toBeNull()
    expect(
      screen.querySelector<HTMLButtonElement>('button[aria-label="导出 PNG"]'),
    ).not.toBeNull()
    expect(
      screen.querySelector<HTMLButtonElement>('button[aria-label="导出项目 JSON"]'),
    ).not.toBeNull()
    expect(
      screen.querySelector<HTMLInputElement>('input[aria-label="导入项目 JSON"]'),
    ).not.toBeNull()
  })

  it('exports project JSON through the toolbar', () => {
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)
    const createObjectUrl = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:voice-canvas-project')
    const revokeObjectUrl = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => undefined)
    const screen = renderApp()
    const exportJson = screen.querySelector<HTMLButtonElement>(
      'button[data-testid="export-project-json"]',
    )

    expect(exportJson).not.toBeNull()
    click(exportJson!)

    expect(createObjectUrl).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:voice-canvas-project')
  })

  it('exports PNG through the toolbar', () => {
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)
    const screen = renderApp()
    const exportPng = screen.querySelector<HTMLButtonElement>(
      'button[data-testid="export-png"]',
    )

    expect(exportPng).not.toBeNull()
    click(exportPng!)

    expect(clickSpy).toHaveBeenCalled()
    expect(screen.textContent).toContain('导出：PNG 图片')
  })

  it('shows runtime settings without exposing secrets', () => {
    const screen = renderApp()

    expect(screen.querySelector('[aria-label="运行设置"]')).not.toBeNull()
    expect(screen.textContent).toContain('Runtime settings')
    expect(screen.textContent).toContain('Local template')
    expect(screen.textContent).toContain('VPS API proxy')
    expect(screen.textContent).toContain('Serverless-compatible')
    expect(screen.textContent).toContain('音效反馈')
    expect(screen.textContent).toContain('文本调试输入')
    expect(screen.textContent).not.toContain('API Key')
    expect(screen.textContent).not.toContain('sk-')
  })

  it('persists runtime settings and hides the text debug input when disabled', () => {
    const screen = renderApp()
    const textDebugToggle = screen.querySelector<HTMLInputElement>(
      'input[aria-label="切换文本调试输入"]',
    )
    const earconToggle = screen.querySelector<HTMLInputElement>(
      'input[aria-label="切换音效反馈"]',
    )
    const runtimeMode = screen.querySelector<HTMLSelectElement>(
      'select[aria-label="API 运行模式"]',
    )

    expect(textDebugToggle).not.toBeNull()
    expect(earconToggle).not.toBeNull()
    expect(runtimeMode).not.toBeNull()
    expect(
      screen.querySelector<HTMLInputElement>('input[aria-label="文本兼容输入"]'),
    ).not.toBeNull()

    act(() => {
      textDebugToggle!.click()
      earconToggle!.click()
      runtimeMode!.value = 'vps-proxy'
      runtimeMode!.dispatchEvent(new Event('change', { bubbles: true }))
    })

    expect(
      screen.querySelector<HTMLInputElement>('input[aria-label="文本兼容输入"]'),
    ).toBeNull()
    expect(localStorage.getItem('voice-canvas-runtime-config')).toContain(
      '"textDebugEnabled":false',
    )
    expect(localStorage.getItem('voice-canvas-runtime-config')).toContain(
      '"earconsEnabled":false',
    )
    expect(localStorage.getItem('voice-canvas-runtime-config')).toContain(
      '"apiMode":"vps-proxy"',
    )

    root?.unmount()
    root = null
    container?.remove()
    container = null

    const rerendered = renderApp()

    expect(
      rerendered.querySelector<HTMLInputElement>(
        'input[aria-label="文本兼容输入"]',
      ),
    ).toBeNull()
    expect(
      rerendered.querySelector<HTMLInputElement>(
        'input[aria-label="切换文本调试输入"]',
      )?.checked,
    ).toBe(false)
    expect(
      rerendered.querySelector<HTMLInputElement>(
        'input[aria-label="切换音效反馈"]',
      )?.checked,
    ).toBe(false)
    expect(
      rerendered.querySelector<HTMLSelectElement>(
        'select[aria-label="API 运行模式"]',
      )?.value,
    ).toBe('vps-proxy')
  })

  it('shows a text compatibility input for local planning', () => {
    const screen = renderApp()

    expect(
      screen.querySelector<HTMLInputElement>('input[aria-label="文本兼容输入"]'),
    ).not.toBeNull()
    expect(screen.textContent).toContain('文本兼容模式')
    expect(screen.querySelector('[aria-label="运行状态"]')).not.toBeNull()
    expect(screen.querySelector('[aria-label="语音控制"]')).not.toBeNull()
    expect(screen.querySelector('[aria-label="命令日志"]')).not.toBeNull()
    expect(screen.textContent).toContain('STT 文本兜底')
  })

  it('creates and executes a pending plan from text input', () => {
    const screen = renderApp()
    const input = screen.querySelector<HTMLInputElement>(
      'input[aria-label="文本兼容输入"]',
    )
    const submit = screen.querySelector<HTMLButtonElement>(
      'button[data-testid="submit-text-plan"]',
    )

    expect(input).not.toBeNull()
    expect(submit).not.toBeNull()

    changeInput(input!, '画一个用户注册登录流程图')
    click(submit!)

    expect(
      screen.querySelector<HTMLElement>('[aria-label="待确认计划"]')
        ?.getAttribute('tabindex'),
    ).toBe('-1')
    expect(screen.textContent).toContain('创建注册登录流程')
    expect(screen.textContent).toContain('执行')

    const execute = screen.querySelector<HTMLButtonElement>(
      'button[data-testid="execute-pending-plan"]',
    )

    expect(execute).not.toBeNull()
    click(execute!)

    expect(window.getProjectState?.().elements['flow-entry']).toMatchObject({
      kind: 'shape',
      label: '打开入口',
    })
    expect(screen.textContent).toContain('已执行')
    expect(screen.textContent).toContain('提交：画一个用户注册登录流程图')
    expect(screen.textContent).toContain('计划：创建注册登录流程')
    expect(screen.textContent).toContain('执行：创建注册登录流程')
  })

  it('shows pending operation counts before execution', () => {
    const screen = renderApp()
    const input = screen.querySelector<HTMLInputElement>(
      'input[aria-label="文本兼容输入"]',
    )
    const submit = screen.querySelector<HTMLButtonElement>(
      'button[data-testid="submit-text-plan"]',
    )

    expect(input).not.toBeNull()
    expect(submit).not.toBeNull()

    changeInput(input!, '画一个用户注册登录流程图')
    click(submit!)

    expect(screen.textContent).toContain('新增 11')
    expect(screen.textContent).toContain('修改 0')
    expect(screen.textContent).toContain('删除 0')
  })

  it('lets a user refine a pending plan with text and records the refinement', () => {
    const screen = renderApp()
    const input = screen.querySelector<HTMLInputElement>(
      'input[aria-label="文本兼容输入"]',
    )
    const submit = screen.querySelector<HTMLButtonElement>(
      'button[data-testid="submit-text-plan"]',
    )

    expect(input).not.toBeNull()
    expect(submit).not.toBeNull()

    changeInput(input!, '画一个用户注册登录流程图')
    click(submit!)

    const refineInput = screen.querySelector<HTMLInputElement>(
      'input[aria-label="文本微调计划"]',
    )
    const refineButton = screen.querySelector<HTMLButtonElement>(
      'button[data-testid="refine-pending-plan"]',
    )

    expect(refineInput).not.toBeNull()
    expect(refineButton).not.toBeNull()

    changeInput(refineInput!, '改成三层系统架构，包含数据库和短信服务')
    click(refineButton!)

    expect(screen.textContent).toContain('创建三层架构图')
    expect(screen.textContent).toContain(
      '微调：改成三层系统架构，包含数据库和短信服务',
    )
  })

  it('records cancellation and undo redo outcomes in the command log', () => {
    const screen = renderApp()
    const input = screen.querySelector<HTMLInputElement>(
      'input[aria-label="文本兼容输入"]',
    )
    const submit = screen.querySelector<HTMLButtonElement>(
      'button[data-testid="submit-text-plan"]',
    )

    expect(input).not.toBeNull()
    expect(submit).not.toBeNull()

    changeInput(input!, '帮我整理一个新产品想法')
    click(submit!)

    const cancel = screen.querySelector<HTMLButtonElement>(
      'button[data-testid="cancel-pending-plan"]',
    )

    expect(cancel).not.toBeNull()
    click(cancel!)

    expect(screen.textContent).toContain('取消：待执行计划')

    changeInput(input!, '画一个用户注册登录流程图')
    click(submit!)

    const execute = screen.querySelector<HTMLButtonElement>(
      'button[data-testid="execute-pending-plan"]',
    )
    expect(execute).not.toBeNull()
    click(execute!)

    const undo = screen.querySelector<HTMLButtonElement>(
      'button[data-testid="undo-command"]',
    )
    const redo = screen.querySelector<HTMLButtonElement>(
      'button[data-testid="redo-command"]',
    )

    expect(undo).not.toBeNull()
    expect(redo).not.toBeNull()

    click(undo!)
    click(redo!)

    expect(screen.textContent).toContain('撤销：上一步操作')
    expect(screen.textContent).toContain('重做：上一步操作')
  })
})
