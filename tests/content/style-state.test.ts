import { describe, expect, it } from "vitest"
import { defaultSettings } from "../../src/domain/settings"
import { createRuntimeState } from "../../src/domain/policy"
import { StyleState, type StyleRoot } from "../../src/content/style-state"

function createRoot(): StyleRoot {
  return { dataset: {} }
}

describe("StyleState", () => {
  it("applies the active mode and marks the page ready", () => {
    const root = createRoot()
    const state = new StyleState(root)

    state.apply(createRuntimeState({ ...defaultSettings, mode: "blurred" }, "home"))

    expect(root.dataset).toEqual({
      hytMode: "blurred",
      hytPreview: "disabled",
      hytReady: "true",
    })
  })

  it("applies the selected solid color as a CSS variable", () => {
    const properties = new Map<string, string>()
    const root: StyleRoot = {
      dataset: {},
      style: {
        setProperty: (property, value) => properties.set(property, value),
        removeProperty: (property) => properties.delete(property),
      },
    }
    const state = new StyleState(root)

    state.apply(createRuntimeState({ ...defaultSettings, mode: "solid-color", solidColor: "#123456" }, "home"))

    expect(properties.get("--hyt-solid-color")).toBe("#123456")
  })

  it("marks hover previews as disabled for interactive modes", () => {
    const root = createRoot()
    const state = new StyleState(root)

    state.apply(
      createRuntimeState(
        { ...defaultSettings, mode: "hidden-except-hover", autoplayPreview: false },
        "home",
      ),
    )

    expect(root.dataset.hytPreview).toBe("disabled")

    state.apply(createRuntimeState({ ...defaultSettings, mode: "blurred" }, "home"))

    expect(root.dataset.hytPreview).toBe("disabled")

    state.apply(createRuntimeState({ ...defaultSettings, mode: "hidden" }, "home"))

    expect(root.dataset.hytPreview).toBeUndefined()
  })

  it("removes the mode when disabled or normal", () => {
    const root = createRoot()
    const state = new StyleState(root)

    state.apply(createRuntimeState({ ...defaultSettings, mode: "hidden" }, "home"))
    state.apply(createRuntimeState({ ...defaultSettings, enabled: false }, "home"))
    expect(root.dataset).toEqual({ hytReady: "true" })

    state.apply(createRuntimeState({ ...defaultSettings, mode: "normal" }, "home"))
    expect(root.dataset).toEqual({ hytReady: "true" })
  })

  it("clears extension state on cleanup", () => {
    const root = createRoot()
    const state = new StyleState(root)

    state.apply(createRuntimeState({ ...defaultSettings, mode: "hidden" }, "home"))
    state.clear()

    expect(root.dataset).toEqual({})
  })
})
