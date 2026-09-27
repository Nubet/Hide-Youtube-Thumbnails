import { describe, expect, it, vi } from "vitest"
import { RuntimeController } from "../../src/application/runtime-controller"
import { defaultSettings } from "../../src/domain/settings"

function createStyleState() {
  return {
    markLoading: vi.fn(),
    apply: vi.fn(),
    clear: vi.fn(),
  }
}

describe("RuntimeController", () => {
  it("refreshes and applies the current runtime state", async () => {
    const styleState = createStyleState()
    const controller = new RuntimeController({
      settingsRepository: { load: vi.fn(async () => ({ ...defaultSettings, mode: "blurred" })) },
      styleState,
      getLocation: () => ({ pathname: "/watch" }),
      classify: () => "watch",
    })

    controller.start()
    await controller.refresh()

    expect(styleState.markLoading).toHaveBeenCalledOnce()
    expect(styleState.apply).toHaveBeenCalledWith({
      supported: true,
      pageType: "watch",
      enabled: true,
      hideShorts: false,
      hidePlayables: true,
      mode: "blurred",
      solidColor: "#e5e5ea",
      hoverDelay: "instant",
      autoplayPreview: false,
    })
  })

  it("ignores an older refresh result", async () => {
    const styleState = createStyleState()
    let resolveFirst: ((settings: typeof defaultSettings) => void) | undefined
    const load = vi
      .fn()
      .mockReturnValueOnce(new Promise<typeof defaultSettings>((resolve) => {
        resolveFirst = resolve
      }))
      .mockResolvedValueOnce({ ...defaultSettings, mode: "solid-color" })
    const controller = new RuntimeController({
      settingsRepository: { load },
      styleState,
      getLocation: () => ({ pathname: "/" }),
      classify: () => "home",
    })

    const firstRefresh = controller.refresh()
    const secondRefresh = controller.refresh()
    await secondRefresh
    resolveFirst?.(defaultSettings)
    await firstRefresh

    expect(styleState.apply).toHaveBeenCalledTimes(1)
    expect(styleState.apply).toHaveBeenCalledWith({
      supported: true,
      pageType: "home",
      enabled: true,
      hideShorts: true,
      hidePlayables: true,
      mode: "solid-color",
      solidColor: "#e5e5ea",
      hoverDelay: "instant",
      autoplayPreview: false,
    })
  })

  it("refreshes when storage changes and cleans up the listener", async () => {
    const styleState = createStyleState()
    let onStorageChange: (() => void) | undefined
    const unsubscribe = vi.fn()
    const controller = new RuntimeController({
      settingsRepository: { load: vi.fn(async () => defaultSettings) },
      styleState,
      getLocation: () => ({ pathname: "/" }),
      classify: () => "home",
      subscribeToStorageChanges: (listener) => {
        onStorageChange = listener
        return unsubscribe
      },
    })

    controller.start()
    await controller.refresh()
    const callsBeforeChange = styleState.apply.mock.calls.length
    onStorageChange?.()
    await controller.refresh()
    controller.dispose()

    expect(styleState.apply.mock.calls.length).toBeGreaterThan(callsBeforeChange)
    expect(unsubscribe).toHaveBeenCalledOnce()
    expect(styleState.clear).toHaveBeenCalledOnce()
  })

  it("refreshes when navigation changes and cleans up the listener", async () => {
    const styleState = createStyleState()
    let onNavigation: (() => void) | undefined
    const unsubscribe = vi.fn()
    const controller = new RuntimeController({
      settingsRepository: { load: vi.fn(async () => defaultSettings) },
      styleState,
      getLocation: () => ({ pathname: "/" }),
      classify: () => "home",
      subscribeToNavigationChanges: (listener) => {
        onNavigation = listener
        return unsubscribe
      },
    })

    controller.start()
    await controller.refresh()
    const callsBeforeNavigation = styleState.apply.mock.calls.length
    onNavigation?.()
    await controller.refresh()
    controller.dispose()

    expect(styleState.apply.mock.calls.length).toBeGreaterThan(callsBeforeNavigation)
    expect(unsubscribe).toHaveBeenCalledOnce()
  })
})
