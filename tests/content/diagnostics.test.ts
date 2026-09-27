import { describe, expect, it } from "vitest"
import { collectDiagnostics } from "../../src/content/diagnostics"
import { createRuntimeState } from "../../src/domain/policy"
import { defaultSettings } from "../../src/domain/settings"

function createRoot(matches: Record<string, Element[]> = {}) {
  return {
    querySelectorAll: (selector: string) => matches[selector] ?? [],
  }
}

describe("collectDiagnostics", () => {
  it("counts known elements per selector group", () => {
    const standardElement = {} as Element
    const modernElement = {} as Element
    const state = createRuntimeState(defaultSettings, "home")
    const snapshot = collectDiagnostics(
      createRoot({
        "ytd-video-renderer ytd-thumbnail": [standardElement],
        "yt-thumbnail-view-model": [modernElement],
      }),
      state,
      "initial",
    )

    expect(snapshot).toMatchObject({
      pageType: "home",
      mode: "hidden",
      enabled: true,
      knownThumbnailCount: 2,
      lastNavigation: "initial",
      selectorCounts: {
        standard: 1,
        modern: 1,
      },
    })
  })

  it("reports normal mode when policy disables the page", () => {
    const state = createRuntimeState(
      { ...defaultSettings, disabledPages: { ...defaultSettings.disabledPages, search: true } },
      "search",
    )

    expect(collectDiagnostics(createRoot(), state, "navigation").mode).toBe("normal")
  })

})
