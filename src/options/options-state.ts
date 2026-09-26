import type { Settings } from "../domain/settings"
import type { ThumbnailMode } from "../domain/thumbnail-mode"

export type OptionsFormValues = {
  enabled: boolean
  mode: ThumbnailMode
  disabledPages: Settings["disabledPages"]
}

export function mergeOptions(
  current: Settings,
  values: OptionsFormValues,
): Settings {
  return {
    ...current,
    enabled: values.enabled,
    mode: values.mode,
    disabledPages: values.disabledPages,
  }
}
