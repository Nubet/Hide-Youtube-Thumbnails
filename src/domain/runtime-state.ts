import type { PageType } from "./page-type"
import type { ThumbnailMode } from "./thumbnail-mode"

export type RuntimeState = {
  supported: boolean
  pageType: PageType
  enabled: boolean
  hideShorts: boolean
  mode: ThumbnailMode
  channelVideosKey?: string
  channelWhitelisted?: boolean
}
