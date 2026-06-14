import { expect, test } from '@playwright/test'

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

  const projectState = await page.evaluate(() => window.getProjectState?.())

  expect(projectState?.elements['flow-entry']).toMatchObject({
    kind: 'shape',
    label: '打开入口',
  })
  expect(projectState?.elements['connector-flow-1']).toMatchObject({
    kind: 'connector',
    fromId: 'flow-entry',
    toId: 'flow-account',
  })
})
