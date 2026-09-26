import type { RuntimeState } from "../domain/runtime-state"
import {
  playablesContainerSelectors,
  playablesLinkSelector,
} from "./playables-selector-registry"

const hiddenAttribute = "data-hyt-playables-hidden"

export class PlayablesState {
  private observer: MutationObserver | undefined

  public constructor(private readonly root: Document) {}

  public apply(state: RuntimeState): void {
    if (!state.hidePlayables) {
      this.clear()
      return
    }

    this.hidePlayables()
    this.startObserver()
  }

  public clear(): void {
    this.observer?.disconnect()
    this.observer = undefined

    for (const element of this.root.querySelectorAll(`[${hiddenAttribute}="true"]`)) {
      element.removeAttribute(hiddenAttribute)
    }
  }

  private startObserver(): void {
    if (this.observer) return

    this.observer = new MutationObserver(() => {
      this.hidePlayables()
    })
    this.observer.observe(this.root.documentElement, {
      childList: true,
      subtree: true,
    })
  }

  private hidePlayables(): void {
    const selector = playablesContainerSelectors.join(",")

    for (const container of this.root.querySelectorAll(selector)) {
      if (container.querySelector(playablesLinkSelector)) {
        container.setAttribute(hiddenAttribute, "true")
      }
    }
  }
}
