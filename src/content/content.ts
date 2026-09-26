import { RuntimeController } from "../application/runtime-controller"
import { subscribeToStorageChanges } from "../infrastructure/browser-api"
import { SettingsRepository } from "../infrastructure/settings-repository"
import { classifyPage } from "./page-classifier"
import { StyleState } from "./style-state"

export default function mountContentScript(): () => void {
  const root = document.documentElement
  const styleState = new StyleState(root)
  const controller = new RuntimeController({
    settingsRepository: new SettingsRepository(),
    styleState,
    getLocation: () => window.location,
    classify: classifyPage,
    subscribeToStorageChanges,
  })

  controller.start()

  return () => controller.dispose()
}
