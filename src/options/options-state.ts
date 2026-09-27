import type { Settings } from "../domain/settings"
import type { ThumbnailMode } from "../domain/thumbnail-mode"

export type OptionsFormValues = {
  enabled: boolean
  hideShortsOnHome: boolean
  hidePlayables: boolean
  mode: ThumbnailMode
  solidColor: string
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
    solidColor: values.solidColor,
    disabledPages: values.disabledPages,
    whitelistedChannels: values.whitelistedChannels,
  }
}
