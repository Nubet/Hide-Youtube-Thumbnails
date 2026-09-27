import { describe, expect, it } from "vitest"
import {
  formatChannelVideosUrl,
  getChannelVideosKey,
  parseChannelWhitelistInput,
} from "../../src/domain/channel-whitelist"

describe("channel whitelist", () => {
  it.each([
    ["/@creator/videos", "@creator"],
    ["/channel/UC123/videos", "channel/UC123"],
    ["/c/creator/videos/", "c/creator"],
    ["/user/creator/videos", "user/creator"],
    ["/@creator", "@creator"],
    ["/channel/UC123/", "channel/UC123"],
  ])("extracts %s as %s", (pathname, expected) => {
    expect(getChannelVideosKey(pathname)).toBe(expected)
  })

  it("does not treat other channel tabs as whitelisted channel pages", () => {
    expect(getChannelVideosKey("/@creator/featured")).toBeUndefined()
    expect(getChannelVideosKey("/@creator/about")).toBeUndefined()
  })

  it("accepts full YouTube videos URLs and rejects other hosts", () => {
    expect(parseChannelWhitelistInput("https://www.youtube.com/@creator/videos")).toBe(
      "@creator",
    )
    expect(parseChannelWhitelistInput("https://www.youtube.com/@creator")).toBe("@creator")
    expect(parseChannelWhitelistInput("youtube.com/@creator")).toBe("@creator")
    expect(parseChannelWhitelistInput("https://example.com/@creator/videos")).toBeUndefined()
  })

  it("formats a stable videos URL for the list", () => {
    expect(formatChannelVideosUrl("@creator")).toBe(
      "https://www.youtube.com/@creator/videos",
    )
  })
})
