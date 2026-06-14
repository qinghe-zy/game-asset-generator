import { expect, test } from '@playwright/test'

interface DebugProjectState {
  elementOrder: string[]
  elements: Record<string, {
    id: string
    kind: string
    label?: string
    fromId?: string
    toId?: string
  }>
}

test('creates and executes a local plan through text fallback', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByLabel('文本兼容输入')).toBeVisible()
  await expect(page.getByLabel('运行状态')).toContainText('等待文本兼容输入')

  await page.getByLabel('文本兼容输入').fill('画一个用户注册登录流程图')
  await page.getByTestId('submit-text-plan').click()

  await expect(page.getByLabel('待确认计划')).toContainText('创建注册登录流程')
  await expect(page.getByLabel('待确认计划')).toContainText('新增 11')

  await page.getByTestId('execute-pending-plan').click()

  await expect(page.getByLabel('运行状态')).toContainText('已执行')
  await expect(page.getByLabel('命令日志')).toContainText('执行：创建注册登录流程')

  const projectState = await page.evaluate<DebugProjectState | undefined>(
    () => window.getProjectState?.(),
  )

  expect(projectState?.elementOrder).toHaveLength(16)

  const elements = Object.values(projectState?.elements ?? {})
  const entry = elements.find((element) => element.label === '打开入口')
  const account = elements.find((element) => element.label === '输入账号')
  const entryToAccount = elements.find(
    (element) =>
      element.kind === 'connector' &&
      element.fromId === entry?.id &&
      element.toId === account?.id,
  )

  expect(entry).toMatchObject({
    kind: 'shape',
    label: '打开入口',
  })
  expect(entryToAccount).toMatchObject({
    kind: 'connector',
    fromId: entry?.id,
    toId: account?.id,
  })
})
