import type { PageType } from "../domain/page-type"
import type { PathLocation } from "../shared/contracts"

export type { PathLocation } from "../shared/contracts"

export function classifyPage(location: PathLocation): PageType {
  const { pathname } = location

  if (pathname === "/") return "home"
  if (pathname === "/results") return "search"
  if (pathname === "/watch") return "watch"
  if (pathname === "/playlist") return "playlist"
  if (pathname === "/feed/subscriptions") return "subscriptions"
  if (pathname === "/feed/trending") return "trending"
  if (pathname === "/feed/history") return "history"
  if (pathname === "/feed/explore") return "explore"
  if (pathname === "/shorts" || pathname.startsWith("/shorts/")) return "shorts"
  if (pathname === "/gaming") return "gaming"
  if (pathname === "/music") return "music"
  if (pathname === "/live") return "live"

  if (
    pathname.startsWith("/@") ||
    pathname.startsWith("/channel/") ||
    pathname.startsWith("/c/") ||
    pathname.startsWith("/user/")
  ) {
    if (/\/videos\/?$/.test(pathname)) return "channel-videos"
    if (/\/streams\/?$/.test(pathname)) return "channel-streams"
    if (/\/shorts\/?$/.test(pathname)) return "other"
    return "channel-home"
  }

  return "other"
}
