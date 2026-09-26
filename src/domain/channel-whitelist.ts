const channelPathPattern = /^\/((?:@|channel\/|c\/|user\/)[^/]+)\/videos\/?$/

export function getChannelVideosKey(pathname: string): string | undefined {
  const match = pathname.match(channelPathPattern)
  return match?.[1]
}

export function parseChannelWhitelistInput(value: string): string | undefined {
  const input = value.trim()
  if (!input) return undefined

  try {
    const url = new URL(
      input.includes("://")
        ? input
        : `https://www.youtube.com/${input.replace(/^\/+/, "")}`,
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
