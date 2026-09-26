import type { Settings } from "../domain/settings"
import type { ThumbnailMode } from "../domain/thumbnail-mode"

export type OptionsFormValues = {
  enabled: boolean
  hideShortsOnHome: boolean
  mode: ThumbnailMode
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
    mode: values.mode,
    disabledPages: values.disabledPages,
    whitelistedChannels: values.whitelistedChannels,
  }
}
