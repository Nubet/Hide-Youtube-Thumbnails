import type { PageType } from "./page-type"
import type { RuntimeState } from "./runtime-state"
import type { Settings } from "./settings"

export function isEnabled(
  settings: Settings,
  pageType: PageType,
  channelKey?: string,
): boolean {
  if (!settings.enabled) return false

  if (pageType === "channel" && channelKey) {
    if (settings.whitelistedChannels.includes(channelKey)) return false
  }

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
  channelKey?: string,
): RuntimeState {
  const state: RuntimeState = {
    supported: true,
    pageType,
    enabled: isEnabled(settings, pageType, channelKey),
    mode: settings.mode,
  }

  if (pageType === "channel" && channelKey) {
    state.channelVideosKey = channelKey
    state.channelWhitelisted = settings.whitelistedChannels.includes(channelKey)
  }

  return state
}
