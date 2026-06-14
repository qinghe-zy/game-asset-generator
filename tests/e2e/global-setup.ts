import { build, preview } from 'vite'

declare global {
  var closeVitePreview: (() => Promise<void>) | undefined
}

export default async function globalSetup() {
  await build({ mode: 'test' })

  const server = await preview({
    preview: {
      host: '127.0.0.1',
      port: 4287,
      strictPort: true,
    },
  })

  globalThis.closeVitePreview = async () => {
    await server.close()
  }

  return async () => {
    await globalThis.closeVitePreview?.()
    globalThis.closeVitePreview = undefined
  }
}
