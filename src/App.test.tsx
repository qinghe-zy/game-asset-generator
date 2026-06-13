import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
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
  it('shows a text compatibility input for local planning', () => {
    const screen = renderApp()

    expect(
      screen.querySelector<HTMLInputElement>('input[aria-label="文本兼容输入"]'),
    ).not.toBeNull()
    expect(screen.textContent).toContain('文本兼容模式')
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
  })
})
