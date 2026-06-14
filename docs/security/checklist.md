# Security Checklist

This checklist tracks the security boundary for the Voice Canvas MVP. It is written against the current `main` branch plus the pending API proxy branch, and should be re-checked after each merge.

## Secret Handling

- Model provider keys must live only in the server environment.
- Frontend code must not contain `DEEPSEEK_API_KEY`, `OPENAI_API_KEY`, `sk-...`, or any production key value.
- `.env` and `.env.*` are ignored by Git; `.env.example` may contain placeholders only.
- The browser may select runtime mode, but it must not ask users to paste a system-owned API key into frontend storage.

## Frontend Boundary

- LLM output enters the app as an `AgentPlan`, not Fabric JSON or executable code.
- `validateAgentPlan` must run before any remote plan is executed.
- Canvas E2E should assert `window.getProjectState()` JSON and DOM states, not pixel-perfect screenshots.
- Imported project JSON must be validated before replacing `ProjectState`.
- Text fallback is allowed for accessibility and China STT limitations, but it should be presented as a fallback path.

## Server Boundary

- The VPS API proxy should listen on `127.0.0.1:3000`.
- Nginx should expose only `/api/*` to the public domain and forward to the local API process.
- Request bodies should be size-limited.
- Model calls should timeout and return typed errors.
- Server logs should avoid storing full prompts if prompts may contain private data.

## Deployment Boundary

- Static files can be copied to `/var/www/040415.xyz/html`.
- HTTPS termination stays in Nginx with the existing Let's Encrypt certificate.
- The Node API process is stateless and can restart safely.
- If moved to Serverless later, rate limiting should live in API Gateway or provider gateway configuration, not function memory.

## Manual Audit Commands

Run these before release:

```bash
git grep -n "DEEPSEEK_API_KEY\\|OPENAI_API_KEY\\|sk-" -- . ':!docs/security/checklist.md'
npm run test
npm run lint
npm run build
```

Expected result: no real secret values, passing automated checks, and only placeholder environment variable names in docs or examples.
