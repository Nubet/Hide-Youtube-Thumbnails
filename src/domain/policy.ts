import type { PageType } from "./page-type"
import type { RuntimeState } from "./runtime-state"
import type { Settings } from "./settings"

export function isEnabled(settings: Settings, pageType: PageType): boolean {
  if (!settings.enabled) return false

  const disabledByPage: Partial<Record<PageType, boolean>> = {
    search: settings.disabledPages.search,
    channel: settings.disabledPages.channel,
    playlist: settings.disabledPages.playlist,
    watch: settings.disabledPages.watch,
    subscriptions: settings.disabledPages.subscriptions,
  }

  return disabledByPage[pageType] !== true
}

export function createRuntimeState(
  settings: Settings,
  pageType: PageType,
): RuntimeState {
  return {
    supported: true,
    pageType,
    enabled: isEnabled(settings, pageType),
    mode: settings.mode,
  }
}
