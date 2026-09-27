import { describe, expect, it, vi } from "vitest"
import { ShortsState } from "../../src/content/shorts-state"

describe("ShortsState", () => {
  it("hides containers containing Shorts links and clears them", () => {
    const shortsCard = {
      querySelector: vi.fn(() => ({} as Element)),
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
    }
    const root = {
      documentElement: {},
      querySelectorAll: vi.fn((selector: string) =>
        selector.startsWith("[") ? [shortsCard] : [shortsCard],
      ),
    }
    const observer = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    }

    vi.stubGlobal("MutationObserver", vi.fn(() => observer))
    const state = new ShortsState(root as unknown as Document)

    state.apply({
      supported: true,
      pageType: "home",
      enabled: true,
      hideShorts: true,
      mode: "hidden",
    })

    expect(shortsCard.setAttribute).toHaveBeenCalledWith(
      "data-hyt-shorts-hidden",
      "true",
    )
    expect(observer.observe).toHaveBeenCalledOnce()

    state.apply({
      supported: true,
      pageType: "search",
      enabled: true,
      hideShorts: false,
      mode: "hidden",
    })

    expect(observer.disconnect).toHaveBeenCalledOnce()
    expect(shortsCard.removeAttribute).toHaveBeenCalledWith("data-hyt-shorts-hidden")
  })
})
