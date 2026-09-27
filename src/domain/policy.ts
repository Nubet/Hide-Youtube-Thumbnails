import type { PageType } from "./page-type"
import type { RuntimeState } from "./runtime-state"
import type { Settings } from "./settings"

export function isEnabled(
  settings: Settings,
  pageType: PageType,
  channelKey?: string,
): boolean {
  if (!settings.enabled) return false

  if ((pageType === "channel-home" || pageType === "channel-videos") && channelKey) {
    if (settings.whitelistedChannels.includes(channelKey)) return false
  }

  return pageType === "other" || pageType === "shorts" || settings.disabledPages[pageType] !== true
}

export function shouldHideShorts(
  settings: Settings,
  pageType: PageType,
): boolean {
  return settings.hideShortsOnHome && pageType === "home"
}

export function shouldHidePlayables(settings: Settings): boolean {
  return settings.hidePlayables
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
    solidColor: settings.solidColor,
    hoverDelay: settings.hoverDelay,
    autoplayPreview: settings.autoplayPreview,
    hideShorts: shouldHideShorts(settings, pageType),
    hidePlayables: shouldHidePlayables(settings),
  }

  if ((pageType === "channel-home" || pageType === "channel-videos" || pageType === "channel-streams") && channelKey) {
    state.channelVideosKey = channelKey
    state.channelWhitelisted = settings.whitelistedChannels.includes(channelKey)
  }

  return state
}
