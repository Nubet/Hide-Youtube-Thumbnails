import { describe, expect, it } from "vitest"
import {
  allThumbnailSelectors,
} from "../../src/content/selector-registry"

describe("thumbnailSelectors", () => {
  it("keeps every selector unique", () => {
    expect(new Set(allThumbnailSelectors).size).toBe(allThumbnailSelectors.length)
  })

  it("avoids an unscoped thumbnail id selector", () => {
    expect(allThumbnailSelectors).not.toContain("#thumbnail")
  })

})
