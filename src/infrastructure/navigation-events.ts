import type { EventSubscription } from "../shared/contracts"

const navigationEventNames = [
  "yt-navigate-finish",
  "yt-page-data-updated",
  "popstate",
  "hashchange",
] as const

export function subscribeToNavigationEvents(
  target: Pick<EventTarget, "addEventListener" | "removeEventListener">,
  listener: () => void,
): ReturnType<EventSubscription> {
  for (const eventName of navigationEventNames) {
    target.addEventListener(eventName, listener)
  }

  return () => {
    for (const eventName of navigationEventNames) {
      target.removeEventListener(eventName, listener)
    }
  }
}
