# Phase D Renderer Acceptance

Date: 2026-06-13

This record closes the Phase D canvas renderer checkpoint before starting the local Agent and execution pipeline work.

## Scope

Accepted in this phase:

- Real Fabric canvas mount and disposal in `CanvasStage`.
- ProjectState shape and text rendering.
- Logical groups rendered as flat background rectangles plus separate titles.
- Connectors rendered from `fromId`/`toId` relationships with midpoint labels.
- Development/test-only `window.getProjectState()` for JSON-based browser and E2E assertions.

Not included in this phase:

- Interactive dragging or Fabric `moving` event hooks.
- Orthogonal connector routing and arrowheads.
- Selection, editing, command routing, Agent execution, persistence, or export.
- Pixel-perfect canvas screenshot tests.

## Automated Evidence

Commands run from `D:\Project\voice-canvas\.worktrees\voice-canvas-phase-d-acceptance`:

| Check | Result |
| --- | --- |
| `npm run test -- src/canvas` | PASS: 2 test files, 8 tests |
| `npm run test` | PASS: 14 test files, 55 tests |
| `npm run build` | PASS: TypeScript build and Vite production build |
| `npm run lint` | PASS |

The canvas-focused test set covers connector geometry and FabricRenderer shape/text/group/connector object creation. The full suite also covers state, commands, layout, Agent plan validation, EntityResolver, CanvasDescriber, and CanvasStage smoke behavior.

## Browser Smoke Evidence

Browser smoke used local Vite on `127.0.0.1:5177` and Edge headless.

Observed result:

```json
{
  "hasLowerCanvas": true,
  "hasUpperCanvas": true,
  "lowerSize": [1280, 720],
  "hasGetter": true,
  "title": "Voice Canvas demo",
  "elementCount": 5,
  "elementOrder": [
    "demo-group",
    "voice-brief",
    "voice-brief-label",
    "agent-plan",
    "voice-to-plan"
  ],
  "groupKind": "group",
  "connectorKind": "connector",
  "connectorFrom": "voice-brief",
  "connectorTo": "agent-plan",
  "demoRegionNonWhite": 32407,
  "connectorRegionNonWhite": 1054,
  "hasPaint": true
}
```

Console errors: `0`.

The pixel sampling is intentionally broad and only checks that the canvas is not blank in the expected demo and connector regions. It is not a pixel-perfect screenshot test.

## Renderer Acceptance Notes

- ProjectState remains the source of truth.
- Groups use ProjectState parent relations and render as ordinary absolute-positioned Fabric objects.
- Native Fabric Group is not used.
- Connectors store relationship IDs, not fixed endpoints.
- Connector geometry is recomputed from current ProjectState during renderer refresh.
- `window.getProjectState()` is gated to Vite dev/test mode and is intended for QA and future E2E tests.

## Safety Notes

- No third-party dependency was added in this checkpoint.
- No API key, token, password, or model credential is stored in renderer code.
- Debug state exposure returns ProjectState only; it does not expose runtime secrets.
- Future E2E should prefer `window.getProjectState()` assertions over canvas DOM internals or pixel-perfect screenshots.

## Phase D Decision

Phase D renderer work is ready to support Phase E local Agent and execution pipeline work.
