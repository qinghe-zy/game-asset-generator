import type { AgentPlan, LayoutIntent, PlanOperation } from './AgentPlan'

export const MAX_PLAN_OPERATIONS = 40

export interface PlanValidationContext {
  existingElementIds?: string[]
}

export type PlanValidationResult =
  | { ok: true; plan: AgentPlan }
  | { ok: false; errors: string[] }

const defaultLayoutIntent: LayoutIntent = {
  type: 'grid',
  mode: 'global',
}

export function isValidationOk(
  result: PlanValidationResult,
): result is { ok: true; plan: AgentPlan } {
  return result.ok
}

export function validateAgentPlan(
  plan: AgentPlan,
  context: PlanValidationContext = {},
): PlanValidationResult {
  const errors: string[] = []

  if (plan.operations.length > MAX_PLAN_OPERATIONS) {
    errors.push(
      `Plan has ${plan.operations.length} operations; maximum is ${MAX_PLAN_OPERATIONS}`,
    )
  }

  validateOperationIds(plan.operations, errors)
  validateReferences(plan.operations, context.existingElementIds ?? [], errors)
  validateDestructiveConfirmation(plan, errors)

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    plan: normalizePlan(plan),
  }
}

function validateOperationIds(
  operations: PlanOperation[],
  errors: string[],
): void {
  const seenIds = new Set<string>()

  for (const operation of operations) {
    if (seenIds.has(operation.id)) {
      errors.push(`Duplicate operation id: ${operation.id}`)
    }

    seenIds.add(operation.id)
  }
}

function validateReferences(
  operations: PlanOperation[],
  existingElementIds: string[],
  errors: string[],
): void {
  const knownElementIds = new Set(existingElementIds)

  for (const operation of operations) {
    for (const createdId of getCreatedElementIds(operation)) {
      knownElementIds.add(createdId)
    }
  }

  for (const operation of operations) {
    for (const referencedId of getReferencedElementIds(operation)) {
      if (!knownElementIds.has(referencedId)) {
        errors.push(
          `Operation ${operation.id} references missing element: ${referencedId}`,
        )
      }
    }
  }
}

function validateDestructiveConfirmation(
  plan: AgentPlan,
  errors: string[],
): void {
  if (plan.requiresConfirmation) {
    return
  }

  for (const operation of plan.operations) {
    if (operation.type === 'delete-element') {
      errors.push(`Destructive operation ${operation.id} requires confirmation`)
    }
  }
}

function normalizePlan(plan: AgentPlan): AgentPlan {
  return {
    ...plan,
    layoutIntent: plan.layoutIntent ?? defaultLayoutIntent,
    riskFlags: plan.riskFlags ?? [],
    fallbackReason: plan.fallbackReason ?? null,
  }
}

function getCreatedElementIds(operation: PlanOperation): string[] {
  switch (operation.type) {
    case 'create-shape':
    case 'create-text':
    case 'create-group':
    case 'create-connector':
      return [operation.elementId]
    case 'update-style':
    case 'move-element':
    case 'delete-element':
    case 'relayout-region':
      return []
  }
}

function getReferencedElementIds(operation: PlanOperation): string[] {
  switch (operation.type) {
    case 'create-connector':
      return [operation.fromId, operation.toId]
    case 'update-style':
    case 'move-element':
    case 'delete-element':
      return [operation.elementId]
    case 'relayout-region':
      return operation.elementIds
    case 'create-group':
      return operation.childIds ?? []
    case 'create-shape':
      return operation.parentId ? [operation.parentId] : []
    case 'create-text':
      return operation.parentId ? [operation.parentId] : []
  }
}
