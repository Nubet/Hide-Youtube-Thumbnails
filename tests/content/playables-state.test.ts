import { describe, expect, it, vi } from "vitest"
import { PlayablesState } from "../../src/content/playables-state"

describe("PlayablesState", () => {
  it("hides containers containing Playables links and clears them", () => {
    const playablesCard = {
      querySelector: vi.fn(() => ({} as Element)),
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
    }
    const root = {
      documentElement: {},
      querySelectorAll: vi.fn((_selector: string) => [playablesCard]),
    }
    const observer = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    }

    vi.stubGlobal("MutationObserver", vi.fn(() => observer))
    const state = new PlayablesState(root as unknown as Document)

    state.apply({
      supported: true,
      pageType: "home",
      enabled: true,
      hideShorts: false,
      hidePlayables: true,
      mode: "hidden",
    })

    expect(playablesCard.setAttribute).toHaveBeenCalledWith(
      "data-hyt-playables-hidden",
      "true",
    )
    expect(observer.observe).toHaveBeenCalledOnce()

    state.apply({
      supported: true,
      pageType: "home",
      enabled: true,
      hideShorts: false,
      hidePlayables: false,
      mode: "hidden",
    })

    expect(observer.disconnect).toHaveBeenCalledOnce()
    expect(playablesCard.removeAttribute).toHaveBeenCalledWith(
      "data-hyt-playables-hidden",
    )
  })
})
