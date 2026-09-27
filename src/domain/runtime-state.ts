import type { PageType } from "./page-type"
import type { ThumbnailMode } from "./thumbnail-mode"
import type { HoverDelay } from "./hover-delay"

export type RuntimeState = {
  supported: boolean
  pageType: PageType
  enabled: boolean
  hideShorts: boolean
  hidePlayables: boolean
  mode: ThumbnailMode
  solidColor: string
  hoverDelay: HoverDelay
  autoplayPreview: boolean
  channelVideosKey?: string
  channelWhitelisted?: boolean
}
