import type { AgentPlan } from '../../agent/AgentPlan'
import './PendingPlanPanel.css'

export interface PendingPlanPanelProps {
  plan: AgentPlan
  onExecute(): void
  onCancel(): void
}

export function PendingPlanPanel({
  plan,
  onExecute,
  onCancel,
}: PendingPlanPanelProps) {
  return (
    <aside className="pendingPlanPanel" aria-label="待确认计划">
      <div>
        <p className="pendingPlanEyebrow">Pending plan</p>
        <h2>{plan.summary}</h2>
        <p className="pendingPlanMeta">
          {plan.operations.length} 个操作 · {plan.layoutIntent.type}
          {plan.fallbackReason ? ` · ${plan.fallbackReason}` : ''}
        </p>
      </div>
      <div className="pendingPlanActions">
        <button
          type="button"
          className="pendingPlanPrimary"
          data-testid="execute-pending-plan"
          onClick={onExecute}
        >
          执行
        </button>
        <button type="button" className="pendingPlanSecondary" onClick={onCancel}>
          取消
        </button>
      </div>
    </aside>
  )
}
