import type { RuntimeState } from "../domain/runtime-state"
import {
  shortsContainerSelectors,
  shortsLinkSelector,
} from "./shorts-selector-registry"

const hiddenAttribute = "data-hyt-shorts-hidden"

export class ShortsState {
  private observer: MutationObserver | undefined

  public constructor(private readonly root: Document) {}

  public apply(state: RuntimeState): void {
    if (!state.hideShorts) {
      this.clear()
      return
    }

    this.hideShorts()
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
      this.hideShorts()
    })
    this.observer.observe(this.root.documentElement, {
      childList: true,
      subtree: true,
    })
  }

  private hideShorts(): void {
    const selector = shortsContainerSelectors.join(",")

    for (const container of this.root.querySelectorAll(selector)) {
      if (container.querySelector(shortsLinkSelector)) {
        container.setAttribute(hiddenAttribute, "true")
      }
    }
  }
}
