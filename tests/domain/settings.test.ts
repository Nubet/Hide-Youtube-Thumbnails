import { describe, expect, it } from "vitest"
import {
  defaultSettings,
  normalizeSettings,
} from "../../src/domain/settings"

describe("normalizeSettings", () => {
  it("returns defaults for empty or invalid data", () => {
    expect(normalizeSettings(undefined)).toEqual(defaultSettings)
    expect(normalizeSettings("invalid")).toEqual(defaultSettings)
  })

  it("fills missing nested values with defaults", () => {
    expect(normalizeSettings({
        enabled: false,
        disabledPages: { search: true },
      }),
    ).toEqual({
      ...defaultSettings,
      enabled: false,
      disabledPages: {
        ...defaultSettings.disabledPages,
        search: true,
      },
    })
  })

  it("rejects unknown modes and schema versions safely", () => {
    expect(normalizeSettings({ mode: "unknown" })).toEqual(defaultSettings)
    expect(normalizeSettings({ schemaVersion: 99 })).toEqual(defaultSettings)
  })

  it("keeps a valid settings object unchanged", () => {
    expect(
      normalizeSettings({
        schemaVersion: 1,
        enabled: false,
        mode: "blurred",
        disabledPages: {
          search: true,
          channel: true,
          playlist: false,
          watch: false,
          subscriptions: true,
        },
      })
    ).toEqual({
      ...defaultSettings,
      enabled: false,
      mode: "blurred",
      disabledPages: {
        ...defaultSettings.disabledPages,
        search: true,
        "channel-home": true,
        "channel-videos": true,
        "channel-streams": true,
        subscriptions: true,
      },
    })
  })

  it("normalizes valid colors and rejects malformed colors", () => {
    expect(normalizeSettings({ solidColor: "#Ab12Ef" }).solidColor).toBe("#ab12ef")
    expect(normalizeSettings({ solidColor: "red" }).solidColor).toBe("#e5e5ea")
  })

  it("accepts supported hover delay presets", () => {
    expect(normalizeSettings({ hoverDelay: "patient" }).hoverDelay).toBe("patient")
    expect(normalizeSettings({ hoverDelay: "unknown" }).hoverDelay).toBe("instant")
  })
})
