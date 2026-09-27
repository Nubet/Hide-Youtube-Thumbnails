import { describe, expect, it } from "vitest"
import { classifyPage } from "../../src/content/page-classifier"

describe("classifyPage", () => {
  it.each([
    ["/", "home"],
    ["/results", "search"],
    ["/watch", "watch"],
    ["/playlist", "playlist"],
    ["/feed/subscriptions", "subscriptions"],
    ["/feed/trending", "trending"],
    ["/feed/history", "history"],
    ["/feed/explore", "explore"],
    ["/gaming", "gaming"],
    ["/music", "music"],
    ["/live", "live"],
    ["/shorts", "shorts"],
    ["/shorts/abc123", "shorts"],
    ["/@creator", "channel-home"],
    ["/@creator/videos", "channel-videos"],
    ["/@creator/streams", "channel-streams"],
    ["/@creator/shorts", "other"],
    ["/channel/UC123", "channel-home"],
    ["/c/creator", "channel-home"],
    ["/user/creator", "channel-home"],
  ])("classifies %s as %s", (pathname, expected) => {
    expect(classifyPage({ pathname })).toBe(expected)
  })

  it("returns other for unknown YouTube routes", () => {
    expect(classifyPage({ pathname: "/unknown" })).toBe("other")
  })
})
