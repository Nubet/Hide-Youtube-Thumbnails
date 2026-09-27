import { describe, expect, it } from "vitest"
import { defaultSettings } from "../../src/domain/settings"
import { mergeOptions } from "../../src/options/options-state"

describe("mergeOptions", () => {
  it("updates form-controlled settings and preserves the schema version", () => {
    expect(
      mergeOptions(defaultSettings, {
        enabled: false,
        hideShortsOnHome: true,
        hidePlayables: false,
        mode: "solid-color",
        disabledPages: { ...defaultSettings.disabledPages, watch: true },
        whitelistedChannels: ["@creator"],
      }),
    ).toEqual({
      ...defaultSettings,
      enabled: false,
      hidePlayables: false,
      mode: "solid-color",
      disabledPages: { ...defaultSettings.disabledPages, watch: true },
      whitelistedChannels: ["@creator"],
    })
  })
})
