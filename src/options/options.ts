import {
  defaultSettings,
  type Settings,
} from "../domain/settings"
import { isThumbnailMode, type ThumbnailMode } from "../domain/thumbnail-mode"
import { SettingsRepository } from "../infrastructure/settings-repository"
import { mergeOptions } from "./options-state"

function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) throw new Error(`Missing options element: ${selector}`)
  return element
}

const form = getRequiredElement<HTMLFormElement>("#settings-form")
const enabledControl = getRequiredElement<HTMLInputElement>("#enabled")
const status = getRequiredElement<HTMLParagraphElement>("#status")
const resetButton = getRequiredElement<HTMLButtonElement>("#reset")

const repository = new SettingsRepository()

function getModeControl(): HTMLInputElement {
  const selected = form.querySelector<HTMLInputElement>("input[name='mode']:checked")
  if (!selected || !isThumbnailMode(selected.value)) {
    throw new Error("A valid thumbnail mode must be selected")
  }
  return selected
}

function getCheckbox(name: string): HTMLInputElement {
  const checkbox = form.querySelector<HTMLInputElement>(`[name='${name}']`)
  if (!checkbox) throw new Error(`Missing option: ${name}`)
  return checkbox
}

function setMode(mode: ThumbnailMode): void {
  const control = form.querySelector<HTMLInputElement>(`input[name='mode'][value='${mode}']`)
  if (!control) throw new Error(`Missing mode option: ${mode}`)
  control.checked = true
}

function renderSettings(settings: Settings): void {
  enabledControl.checked = settings.enabled
  setMode(settings.mode)
  getCheckbox("disable-search").checked = settings.disabledPages.search
  getCheckbox("disable-channel").checked = settings.disabledPages.channel
  getCheckbox("disable-playlist").checked = settings.disabledPages.playlist
  getCheckbox("disable-watch").checked = settings.disabledPages.watch
  getCheckbox("disable-subscriptions").checked = settings.disabledPages.subscriptions
}

function readSettings(current: Settings): Settings {
  return mergeOptions(current, {
    enabled: enabledControl.checked,
    mode: getModeControl().value as ThumbnailMode,
    disabledPages: {
      search: getCheckbox("disable-search").checked,
      channel: getCheckbox("disable-channel").checked,
      playlist: getCheckbox("disable-playlist").checked,
      watch: getCheckbox("disable-watch").checked,
      subscriptions: getCheckbox("disable-subscriptions").checked,
    },
  })
}

async function loadSettings(): Promise<void> {
  try {
    renderSettings(await repository.load())
    status.textContent = "Settings loaded"
  } catch {
    renderSettings(defaultSettings)
    status.textContent = "Could not load settings"
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault()
  void (async () => {
    try {
      const current = await repository.load()
      await repository.save(readSettings(current))
      status.textContent = "Settings saved"
    } catch {
      status.textContent = "Could not save settings"
    }
  })()
})

resetButton.addEventListener("click", () => {
  void (async () => {
    try {
      await repository.reset()
      renderSettings(defaultSettings)
      status.textContent = "Settings reset"
    } catch {
      status.textContent = "Could not reset settings"
    }
  })()
})

void loadSettings()
