import type { PageType } from "./page-type"
import type { ThumbnailMode } from "./thumbnail-mode"

export type RuntimeState = {
  supported: boolean
  pageType: PageType
  enabled: boolean
  mode: ThumbnailMode
}
