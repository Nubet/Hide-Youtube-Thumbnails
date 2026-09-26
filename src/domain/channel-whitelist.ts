const channelPathPattern = /^\/((?:@|channel\/|c\/|user\/)[^/]+)(?:\/videos)?\/?$/

export function getChannelVideosKey(pathname: string): string | undefined {
  const match = pathname.match(channelPathPattern)
  return match?.[1]
}

export function parseChannelWhitelistInput(value: string): string | undefined {
  const input = value.trim()
  if (!input) return undefined

  try {
    const normalizedInput = /^(?:www\.|m\.)?youtube\.com\//i.test(input)
      ? `https://${input}`
      : input
    const url = new URL(
      normalizedInput.includes("://")
        ? normalizedInput
        : `https://www.youtube.com/${normalizedInput.replace(/^\/+/, "")}`,
    )

    if (url.hostname !== "youtube.com" && !url.hostname.endsWith(".youtube.com")) {
      return undefined
    }

    return getChannelVideosKey(url.pathname)
  } catch {
    return undefined
  }
}

export function formatChannelVideosUrl(channelKey: string): string {
  return `https://www.youtube.com/${channelKey}/videos`
}
