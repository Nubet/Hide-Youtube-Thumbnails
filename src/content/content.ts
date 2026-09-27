import { RuntimeController } from "../application/runtime-controller"
import { subscribeToStorageChanges } from "../infrastructure/browser-api"
import { subscribeToNavigationEvents } from "../infrastructure/navigation-events"
import { subscribeToMessages } from "../infrastructure/message-bus"
import { SettingsRepository } from "../infrastructure/settings-repository"
import { Diagnostics } from "./diagnostics"
import { isThumbnailMode } from "../domain/thumbnail-mode"
import { classifyPage } from "./page-classifier"
import { StyleState } from "./style-state"
import { getChannelVideosKey } from "../domain/channel-whitelist"
import { PlayablesState } from "./playables-state"
import { ShortsState } from "./shorts-state"
import { HoverRevealState } from "./hover-reveal-state"
import { HoverPreviewState } from "./hover-preview-state"
import { disableablePages } from "../domain/page-type"

export default function mountContentScript(): () => void {
  const root = document.documentElement
  const styleState = new StyleState(root)
  const playablesState = new PlayablesState(document)
  const shortsState = new ShortsState(document)
  const hoverRevealState = new HoverRevealState(document)
  const hoverPreviewState = new HoverPreviewState(document)
  const settingsRepository = new SettingsRepository()
  const diagnostics = new Diagnostics(document)
  let lastNavigation = "initial"
  const controller = new RuntimeController({
    settingsRepository,
    styleState,
    playablesState,
    shortsState,
    hoverRevealState,
    hoverPreviewState,
    getLocation: () => window.location,
    classify: classifyPage,
    subscribeToStorageChanges,
    subscribeToNavigationChanges: (listener) =>
      subscribeToNavigationEvents(window, () => {
        lastNavigation = new Date().toISOString()
        listener()
      }),
    onStateApplied: (state) => diagnostics.record(state, lastNavigation),
  })

  controller.start()

  const unsubscribeFromMessages = subscribeToMessages(async (message) => {
    if (message.type === "get-runtime-state") {
      const state = controller.getState()
      return state
        ? { ok: true, state }
        : { ok: false, error: "Runtime state is not ready" }
    }

    const settings = await settingsRepository.load()

    if (message.type === "set-enabled") {
      await settingsRepository.save({ ...settings, enabled: message.enabled })
    } else if (message.type === "set-hide-shorts-on-home") {
      await settingsRepository.save({ ...settings, hideShortsOnHome: message.enabled })
    } else if (message.type === "set-hide-playables") {
      await settingsRepository.save({ ...settings, hidePlayables: message.enabled })
    } else if (message.type === "set-thumbnail-mode") {
      if (!isThumbnailMode(message.mode)) {
        return { ok: false, error: "Unsupported thumbnail mode" }
      }
      await settingsRepository.save({ ...settings, mode: message.mode })
    } else if (message.type === "set-solid-color") {
      await settingsRepository.save({ ...settings, solidColor: message.color })
    } else if (message.type === "set-hover-delay") {
      await settingsRepository.save({ ...settings, hoverDelay: message.delay })
    } else if (message.type === "set-autoplay-preview") {
      await settingsRepository.save({ ...settings, autoplayPreview: message.enabled })
    } else if (message.type === "set-page-enabled") {
      if (!disableablePages.includes(message.page)) {
        return { ok: false, error: "Unsupported YouTube page" }
      }

      await settingsRepository.save({
        ...settings,
        disabledPages: { ...settings.disabledPages, [message.page]: !message.enabled },
      })
    } else if (message.type === "add-current-channel") {
      const channelKey = getChannelVideosKey(window.location.pathname)
      if (!channelKey) {
        return {
          ok: false,
          error: "Open a channel's Videos tab to add it to the thumbnail exceptions",
        }
      }

      await settingsRepository.save({
        ...settings,
        whitelistedChannels: [...new Set([...settings.whitelistedChannels, channelKey])],
      })
    }

    await controller.refresh()
    return { ok: true }
  })

  return () => {
    unsubscribeFromMessages()
    controller.dispose()
  }
}
