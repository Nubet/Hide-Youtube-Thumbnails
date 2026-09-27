import type { Settings } from "../domain/settings"
import type { ThumbnailMode } from "../domain/thumbnail-mode"

export type OptionsFormValues = {
  enabled: boolean
  hideShortsOnHome: boolean
  hidePlayables: boolean
  mode: ThumbnailMode
  solidColor: string
  hoverDelay: Settings["hoverDelay"]
  autoplayPreview: boolean
  disabledPages: Settings["disabledPages"]
  whitelistedChannels: string[]
}

export function mergeOptions(
  current: Settings,
  values: OptionsFormValues,
): Settings {
  return {
    ...current,
    enabled: values.enabled,
    hideShortsOnHome: values.hideShortsOnHome,
    hidePlayables: values.hidePlayables,
    mode: values.mode,
    solidColor: values.solidColor ?? current.solidColor,
    hoverDelay: values.hoverDelay ?? current.hoverDelay,
    autoplayPreview: values.autoplayPreview ?? current.autoplayPreview,
    disabledPages: values.disabledPages,
    whitelistedChannels: values.whitelistedChannels,
  }
}
