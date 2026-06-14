# Serverless Compatibility Notes

Voice Canvas MVP uses the provided VPS as the production target. The frontend is served by Nginx, and the Agent API runs as a Node/Express process on `127.0.0.1:3000`.

This document records how the same API shape can later move to a domestic Serverless runtime without changing the frontend contract.

## Current Contract

The browser calls same-origin API routes:

- `GET /api/health`
- `POST /api/agent/plan`

`POST /api/agent/plan` accepts:

- `prompt`: user request text.
- `canvasSummary`: compact canvas context from `CanvasDescriber`.
- `existingElementIds`: current element IDs for validation and collision checks.

It returns:

- `{ "plan": AgentPlan }` on success.
- A typed error body with `code` and `message` on failure.

The frontend should keep this route shape whether the backend is Express, a cloud function, or an API Gateway integration.

## What Can Move To Serverless

The following logic is safe to extract into a stateless handler:

- Request body parsing and size validation.
- Prompt construction.
- Domestic LLM provider call.
- Timeout handling.
- AgentPlan parsing and validation.
- Typed error normalization.

The current Express server should remain a thin host around this logic. A future function adapter can call the same core handler and translate the provider runtime request/response format.

## What Should Stay Outside Function Memory

Do not rely on function instance memory for production controls that must survive cold starts or horizontal scaling:

- Per-IP request counters.
- Daily quota counters.
- Blacklists.
- Long-lived sessions.
- Project storage.

For the MVP, the VPS can apply coarse controls through Nginx or a process manager. For Serverless, use the cloud platform boundary instead.

## Recommended Gateway Controls

When migrating to Alibaba Cloud Function Compute, Tencent Cloud SCF, or a similar domestic runtime, put API Gateway or an equivalent gateway in front of the function.

Recommended controls:

- Per-IP QPS limit.
- Per-IP or ClientId daily call cap.
- Request body size limit.
- CORS allowlist for production domains.
- Timeout lower than the browser request timeout.
- Access logs without model keys or raw secrets.

This keeps the function code focused on Agent planning and avoids introducing Redis solely for MVP rate limiting.

## Environment Variables

Serverless environment variables should mirror the VPS process variables:

```text
DEEPSEEK_API_KEY=server-side-only
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

Never expose these values through Vite `VITE_*` variables or frontend runtime settings.

## Migration Checklist

1. Extract the Agent planning handler from the Express route into a reusable function.
2. Add a small adapter for the selected Serverless request/response shape.
3. Configure API Gateway routes for `/api/health` and `/api/agent/plan`.
4. Configure gateway rate limits and body size limits.
5. Configure environment variables in the cloud console.
6. Run the same Agent API tests against the handler.
7. Run browser E2E against the deployed gateway route.
8. Keep the VPS route available until the gateway route passes smoke checks.

## Non-Goals For MVP

- Serverless deployment is not required for the first release.
- Redis-backed quota storage is not required for the first release.
- User login and per-account billing are outside MVP scope.
- Backend STT is a separate future service and should not be coupled to the Agent API migration.
