export type PageType =
  | "home"
  | "search"
  | "channel-home"
  | "channel-videos"
  | "channel-streams"
  | "watch"
  | "playlist"
  | "subscriptions"
  | "shorts"
  | "trending"
  | "history"
  | "explore"
  | "gaming"
  | "music"
  | "live"
  | "other"

export type DisableablePage = Exclude<PageType, "other" | "shorts">

export const disableablePages: readonly DisableablePage[] = [
  "home",
  "search",
  "watch",
  "playlist",
  "subscriptions",
  "trending",
  "history",
  "explore",
  "channel-home",
  "channel-videos",
  "channel-streams",
  "gaming",
  "music",
  "live",
] as const

export const pageLabels: Record<DisableablePage, string> = {
  home: "Home page",
  search: "Search results",
  watch: "Watch pages",
  playlist: "Playlist pages",
  subscriptions: "Subscriptions",
  trending: "Trending",
  history: "Watch history",
  explore: "Explore",
  "channel-home": "Channel home pages",
  "channel-videos": "Channel video tabs",
  "channel-streams": "Channel live streams",
  gaming: "Gaming",
  music: "Music",
  live: "Live",
}
