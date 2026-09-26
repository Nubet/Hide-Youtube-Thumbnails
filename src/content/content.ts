import { defaultSettings } from "../domain/settings"
import { SettingsRepository } from "../infrastructure/settings-repository"
import { StyleState } from "./style-state"

export default function mountContentScript(): () => void {
  const root = document.documentElement
  const styleState = new StyleState(root)
  const settingsRepository = new SettingsRepository()

  styleState.markLoading()

  void settingsRepository
    .load()
    .then((settings) => styleState.apply(settings))
    .catch(() => styleState.apply(defaultSettings))

  return () => styleState.clear()
}
