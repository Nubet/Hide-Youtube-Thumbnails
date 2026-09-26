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
  if (pathname === "/shorts" || pathname.startsWith("/shorts/")) return "shorts"

  if (
    pathname.startsWith("/@") ||
    pathname.startsWith("/channel/") ||
    pathname.startsWith("/c/") ||
    pathname.startsWith("/user/")
  ) {
    return "channel"
  }

  return "other"
}
