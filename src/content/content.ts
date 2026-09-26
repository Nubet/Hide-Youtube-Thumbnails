import { RuntimeController } from "../application/runtime-controller"
import { subscribeToStorageChanges } from "../infrastructure/browser-api"
import { subscribeToNavigationEvents } from "../infrastructure/navigation-events"
import { subscribeToMessages } from "../infrastructure/message-bus"
import { SettingsRepository } from "../infrastructure/settings-repository"
import { Diagnostics } from "./diagnostics"
import { isThumbnailMode } from "../domain/thumbnail-mode"
import { classifyPage } from "./page-classifier"
import { StyleState } from "./style-state"

export default function mountContentScript(): () => void {
  const root = document.documentElement
  const styleState = new StyleState(root)
  const settingsRepository = new SettingsRepository()
  const diagnostics = new Diagnostics(document)
  let lastNavigation = "initial"
  const controller = new RuntimeController({
    settingsRepository,
    styleState,
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
    } else if (message.type === "set-thumbnail-mode") {
      if (!isThumbnailMode(message.mode)) {
        return { ok: false, error: "Unsupported thumbnail mode" }
      }
      await settingsRepository.save({ ...settings, mode: message.mode })
    } else if (message.type === "disable-on-current-page") {
      const pageType = classifyPage(window.location)
      if (!(pageType in settings.disabledPages)) {
        return { ok: false, error: `Cannot disable extension on ${pageType}` }
      }

      await settingsRepository.save({
        ...settings,
        disabledPages: {
          ...settings.disabledPages,
          [pageType as keyof typeof settings.disabledPages]: true,
        },
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
