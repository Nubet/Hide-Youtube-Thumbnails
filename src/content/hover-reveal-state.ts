import { hoverDelayMilliseconds } from "../domain/hover-delay"
import type { RuntimeState } from "../domain/runtime-state"

const hoverableSelector = [
  "ytd-rich-item-renderer",
  "ytd-grid-video-renderer",
  "ytd-playlist-video-renderer",
  "ytm-shorts-lockup-view-model",
].join(",")

const revealedAttribute = "data-hyt-hover-revealed"

export class HoverRevealState {
  private readonly timers = new Map<Element, number>()
  private listening = false

  public constructor(private readonly root: Document) {}

  public apply(state: RuntimeState): void {
    this.clearRevealState()
    this.currentDelay = state.hoverDelay

    if (!state.enabled || state.mode !== "hidden-except-hover") {
      this.stopListening()
      return
    }

    this.startListening()
    for (const container of this.root.querySelectorAll(hoverableSelector)) {
      if (container.matches(":hover")) this.scheduleReveal(container)
    }
  }

  public clear(): void {
    this.clearRevealState()
    this.stopListening()
  }

  private readonly handlePointerOver = (event: PointerEvent): void => {
    const target = event.target
    if (!(target instanceof Element)) return

    const container = target.closest(hoverableSelector)
    if (!container) return

    const relatedTarget = event.relatedTarget
    if (relatedTarget instanceof Node && container.contains(relatedTarget)) return

    this.scheduleReveal(container)
  }

  private readonly handlePointerOut = (event: PointerEvent): void => {
    const target = event.target
    if (!(target instanceof Element)) return

    const container = target.closest(hoverableSelector)
    if (!container) return

    const relatedTarget = event.relatedTarget
    if (relatedTarget instanceof Node && container.contains(relatedTarget)) return

    this.cancelReveal(container)
  }

  private currentDelay: RuntimeState["hoverDelay"] = "instant"

  private scheduleReveal(container: Element): void {
    this.cancelReveal(container)

    const delay = hoverDelayMilliseconds[this.currentDelay]
    if (delay === 0) {
      container.setAttribute(revealedAttribute, "true")
      return
    }

    const timer = window.setTimeout(() => {
      this.timers.delete(container)
      container.setAttribute(revealedAttribute, "true")
    }, delay)
    this.timers.set(container, timer)
  }

  private cancelReveal(container: Element): void {
    const timer = this.timers.get(container)
    if (timer !== undefined) window.clearTimeout(timer)
    this.timers.delete(container)
    container.removeAttribute(revealedAttribute)
  }

  private clearRevealState(): void {
    for (const timer of this.timers.values()) window.clearTimeout(timer)
    this.timers.clear()

    for (const container of this.root.querySelectorAll(`[${revealedAttribute}]`)) {
      container.removeAttribute(revealedAttribute)
    }
  }

  private startListening(): void {
    if (this.listening) return
    this.root.addEventListener("pointerover", this.handlePointerOver)
    this.root.addEventListener("pointerout", this.handlePointerOut)
    this.listening = true
  }

  private stopListening(): void {
    if (!this.listening) return
    this.root.removeEventListener("pointerover", this.handlePointerOver)
    this.root.removeEventListener("pointerout", this.handlePointerOut)
    this.listening = false
  }
}
