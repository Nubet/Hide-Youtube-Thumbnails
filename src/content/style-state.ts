import type { RuntimeState } from "../domain/runtime-state"

export type StyleRoot = {
  dataset: DOMStringMap
}

const MODE_ATTRIBUTE = "hytMode"
const READY_ATTRIBUTE = "hytReady"

export class StyleState {
  public constructor(private readonly root: StyleRoot) {}

  public markLoading(): void {
    delete this.root.dataset[MODE_ATTRIBUTE]
    delete this.root.dataset[READY_ATTRIBUTE]
  }

  public apply(state: RuntimeState): void {
    const shouldApplyMode = state.enabled && state.mode !== "normal"

    if (shouldApplyMode) {
      this.root.dataset[MODE_ATTRIBUTE] = state.mode
    } else {
      delete this.root.dataset[MODE_ATTRIBUTE]
    }

    this.root.dataset[READY_ATTRIBUTE] = "true"
  }

  public clear(): void {
    delete this.root.dataset[MODE_ATTRIBUTE]
    delete this.root.dataset[READY_ATTRIBUTE]
  }
}
