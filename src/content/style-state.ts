import type { RuntimeState } from "../domain/runtime-state"

export type StyleRoot = {
  dataset: DOMStringMap
  style?: {
    setProperty(property: string, value: string): void
    removeProperty(property: string): void
  }
}

const MODE_ATTRIBUTE = "hytMode"
const READY_ATTRIBUTE = "hytReady"
const SOLID_COLOR_PROPERTY = "--hyt-solid-color"

export class StyleState {
  public constructor(private readonly root: StyleRoot) {}

  public markLoading(): void {
    delete this.root.dataset[MODE_ATTRIBUTE]
    delete this.root.dataset[READY_ATTRIBUTE]
    this.root.style?.removeProperty(SOLID_COLOR_PROPERTY)
  }

  public apply(state: RuntimeState): void {
    const shouldApplyMode = state.enabled && state.mode !== "normal"

    if (shouldApplyMode) {
      this.root.dataset[MODE_ATTRIBUTE] = state.mode
    } else {
      delete this.root.dataset[MODE_ATTRIBUTE]
    }

    if (state.mode === "solid-color") {
      this.root.style?.setProperty(SOLID_COLOR_PROPERTY, state.solidColor)
    } else {
      this.root.style?.removeProperty(SOLID_COLOR_PROPERTY)
    }

    this.root.dataset[READY_ATTRIBUTE] = "true"
  }

  public clear(): void {
    delete this.root.dataset[MODE_ATTRIBUTE]
    delete this.root.dataset[READY_ATTRIBUTE]
    this.root.style?.removeProperty(SOLID_COLOR_PROPERTY)
  }
}
