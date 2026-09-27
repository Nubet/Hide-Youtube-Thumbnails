import { describe, expect, it } from "vitest"
import { createRuntimeState, isEnabled } from "../../src/domain/policy"
import { defaultSettings } from "../../src/domain/settings"

describe("policy", () => {
  it("disables the extension globally when settings are disabled", () => {
    const settings = { ...defaultSettings, enabled: false }

    expect(isEnabled(settings, "home")).toBe(false)
    expect(isEnabled(settings, "other")).toBe(false)
  })

  it("disables only configured page types", () => {
    const settings = {
      ...defaultSettings,
      disabledPages: { ...defaultSettings.disabledPages, search: true },
    }

    expect(isEnabled(settings, "search")).toBe(false)
    expect(isEnabled(settings, "watch")).toBe(true)
  })

  it("keeps route exceptions separate from channel whitelist exceptions", () => {
    const settings = {
      ...defaultSettings,
      disabledPages: { ...defaultSettings.disabledPages, search: true },
      whitelistedChannels: ["@creator"],
    }

    expect(isEnabled(settings, "search")).toBe(false)
    expect(isEnabled(settings, "channel-videos", "@creator")).toBe(false)
  })

  it("creates a complete runtime state", () => {
    const state = createRuntimeState(
      { ...defaultSettings, mode: "blurred" },
      "watch",
    )

    expect(state).toEqual({
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

  it("hides Shorts on home and search pages", () => {
    const settings = { ...defaultSettings, hideShortsOnHome: true }

    expect(createRuntimeState(settings, "home").hideShorts).toBe(true)
    expect(createRuntimeState(settings, "search").hideShorts).toBe(true)
    expect(createRuntimeState(settings, "watch").hideShorts).toBe(false)
  })
})
