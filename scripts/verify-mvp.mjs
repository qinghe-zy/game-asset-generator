import { spawn } from 'node:child_process'

const steps = [
  {
    label: 'unit tests',
    command: process.execPath,
    args: [
      'node_modules/vitest/vitest.mjs',
      'run',
      '--maxWorkers=1',
      '--no-file-parallelism',
    ],
  },
  {
    label: 'agent api tests',
    command: process.execPath,
    args: [
      'node_modules/vitest/vitest.mjs',
      'run',
      'api/agent',
      '--maxWorkers=1',
      '--no-file-parallelism',
    ],
  },
  {
    label: 'lint',
    command: process.execPath,
    args: ['node_modules/eslint/bin/eslint.js', '.'],
  },
  {
    label: 'production build',
    command: process.execPath,
    args: ['node_modules/typescript/bin/tsc', '-b'],
  },
  {
    label: 'frontend bundle',
    command: process.execPath,
    args: ['node_modules/vite/bin/vite.js', 'build'],
  },
  {
    label: 'browser e2e',
    command: process.execPath,
    args: ['node_modules/playwright/cli.js', 'test'],
  },
]

for (const step of steps) {
  await runStep(step)
}

async function runStep(step) {
  console.log(`\n[verify:mvp] ${step.label}`)

  const exitCode = await new Promise((resolve) => {
    const child = spawn(step.command, step.args, {
      stdio: 'inherit',
      shell: false,
      env: process.env,
    })

    child.on('error', (error) => {
      console.error(error)
      resolve(1)
    })

    child.on('close', (code) => {
      resolve(code ?? 1)
    })
  })

  if (exitCode !== 0) {
    process.exit(exitCode)
  }
}
