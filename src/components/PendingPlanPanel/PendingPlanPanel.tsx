import { useState, type FormEvent } from 'react'
import type { AgentPlan } from '../../agent/AgentPlan'
import './PendingPlanPanel.css'

export interface PendingPlanPanelProps {
  plan: AgentPlan
  onExecute(): void
  onCancel(): void
  onRefine(refinement: string): void
}

export function PendingPlanPanel({
  plan,
  onExecute,
  onCancel,
  onRefine,
}: PendingPlanPanelProps) {
  const [refinement, setRefinement] = useState('')
  const counts = countOperations(plan)

  const submitRefinement = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextRefinement = refinement.trim()

    if (!nextRefinement) {
      return
    }

    onRefine(nextRefinement)
    setRefinement('')
  }

  return (
    <aside className="pendingPlanPanel" aria-label="待确认计划">
      <div className="pendingPlanContent">
        <p className="pendingPlanEyebrow">Pending plan</p>
        <h2>{plan.summary}</h2>
        <p className="pendingPlanMeta">
          {plan.operations.length} 个操作 · {plan.layoutIntent.type}
          {plan.fallbackReason ? ` · ${plan.fallbackReason}` : ''}
        </p>
        <dl className="pendingPlanCounts" aria-label="计划操作统计">
          <div>
            <dt>新增 </dt>
            <dd>{counts.created}</dd>
          </div>
          <div>
            <dt>修改 </dt>
            <dd>{counts.modified}</dd>
          </div>
          <div>
            <dt>删除 </dt>
            <dd>{counts.deleted}</dd>
          </div>
        </dl>
      </div>
      <div className="pendingPlanControls">
        <form className="pendingPlanRefine" onSubmit={submitRefinement}>
          <input
            type="text"
            aria-label="文本微调计划"
            placeholder="文本微调"
            value={refinement}
            onChange={(event) => setRefinement(event.target.value)}
          />
          <button
            type="submit"
            className="pendingPlanSecondary"
            data-testid="refine-pending-plan"
          >
            微调
          </button>
        </form>
        <div className="pendingPlanActions">
          <button
            type="button"
            className="pendingPlanPrimary"
            data-testid="execute-pending-plan"
            onClick={onExecute}
          >
            执行
          </button>
          <button
            type="button"
            className="pendingPlanSecondary"
            data-testid="cancel-pending-plan"
            onClick={onCancel}
          >
            取消
          </button>
        </div>
      </div>
    </aside>
  )
}

function countOperations(plan: AgentPlan) {
  return plan.operations.reduce(
    (counts, operation) => {
      if (
        operation.type === 'create-shape' ||
        operation.type === 'create-text' ||
        operation.type === 'create-group' ||
        operation.type === 'create-connector'
      ) {
        counts.created += 1
      } else if (operation.type === 'delete-element') {
        counts.deleted += 1
      } else {
        counts.modified += 1
      }

      return counts
    },
    { created: 0, modified: 0, deleted: 0 },
  )
}
