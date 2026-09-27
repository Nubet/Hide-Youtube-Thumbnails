import { describe, expect, it, vi } from "vitest"
import { subscribeToNavigationEvents } from "../../src/infrastructure/navigation-events"

function createEventTarget() {
  const listeners = new Map<string, Set<() => void>>()

  return {
    addEventListener: vi.fn((name: string, listener: () => void) => {
      const eventListeners = listeners.get(name) ?? new Set<() => void>()
      eventListeners.add(listener)
      listeners.set(name, eventListeners)
    }),
    removeEventListener: vi.fn((name: string, listener: () => void) => {
      listeners.get(name)?.delete(listener)
    }),
    dispatch(name: string) {
      for (const listener of listeners.get(name) ?? []) listener()
    },
  }
}

describe("subscribeToNavigationEvents", () => {
  it("subscribes to YouTube and browser navigation events", () => {
    const target = createEventTarget()
    const listener = vi.fn()

    const unsubscribe = subscribeToNavigationEvents(target, listener)

    target.dispatch("yt-navigate-finish")
    target.dispatch("yt-page-data-updated")
    target.dispatch("popstate")
    target.dispatch("hashchange")

    expect(listener).toHaveBeenCalledTimes(4)
    expect(target.addEventListener).toHaveBeenCalledTimes(4)

    unsubscribe()
    expect(target.removeEventListener).toHaveBeenCalledTimes(4)
  })

  it("does not react after cleanup", () => {
    const target = createEventTarget()
    const listener = vi.fn()
    const unsubscribe = subscribeToNavigationEvents(target, listener)

    unsubscribe()
    target.dispatch("popstate")

    expect(listener).not.toHaveBeenCalled()
  })
})
