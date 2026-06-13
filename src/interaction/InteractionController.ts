import type { ProjectState } from '../state/projectState'

export interface PendingPlan {
  id: string
  summary: string
  baseVersion: number
  requiresConfirmation: boolean
}

export interface PlannerContext {
  signal: AbortSignal
  baseVersion: number
}

export type Planner = (
  input: string,
  context: PlannerContext,
) => Promise<PendingPlan>

export type PlanRequestResult =
  | { status: 'pending'; plan: PendingPlan }
  | { status: 'stale'; plan: PendingPlan; currentVersion: number }
  | { status: 'aborted' }
  | { status: 'error'; error: unknown }

export class InteractionController {
  private state: ProjectState
  private readonly planner: Planner
  private activeAbortController: AbortController | null = null
  private pendingPlan: PendingPlan | null = null

  constructor(initialState: ProjectState, planner: Planner) {
    this.state = initialState
    this.planner = planner
  }

  getState(): ProjectState {
    return this.state
  }

  getPendingPlan(): PendingPlan | null {
    return this.pendingPlan
  }

  applyExternalState(
    update: (state: ProjectState) => ProjectState,
  ): ProjectState {
    this.state = update(this.state)
    return this.state
  }

  cancelActiveRequest(): void {
    this.activeAbortController?.abort()
    this.activeAbortController = null
    this.pendingPlan = null
  }

  async requestPlan(input: string): Promise<PlanRequestResult> {
    this.cancelActiveRequest()

    const abortController = new AbortController()
    const baseVersion = this.state.version
    this.activeAbortController = abortController

    try {
      const plan = await this.planner(input, {
        signal: abortController.signal,
        baseVersion,
      })

      if (abortController.signal.aborted) {
        return { status: 'aborted' }
      }

      if (this.state.version !== baseVersion) {
        return {
          status: 'stale',
          plan,
          currentVersion: this.state.version,
        }
      }

      this.pendingPlan = plan
      return { status: 'pending', plan }
    } catch (error) {
      if (abortController.signal.aborted) {
        return { status: 'aborted' }
      }

      return { status: 'error', error }
    } finally {
      if (this.activeAbortController === abortController) {
        this.activeAbortController = null
      }
    }
  }
}
