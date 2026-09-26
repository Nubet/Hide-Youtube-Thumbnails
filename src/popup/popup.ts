import { sendMessageToActiveTab } from "../infrastructure/message-bus"
import { SettingsRepository } from "../infrastructure/settings-repository"
import type { ExtensionResponse } from "../shared/messages"

function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) throw new Error(`Missing popup element: ${selector}`)
  return element
}

const enabledControl = getRequiredElement<HTMLInputElement>("#enabled")
const modeControl = getRequiredElement<HTMLSelectElement>("#mode")
const pageStatus = getRequiredElement<HTMLParagraphElement>("#page-status")
const status = getRequiredElement<HTMLParagraphElement>("#status")
const disablePageButton = getRequiredElement<HTMLButtonElement>("#disable-page")
const settingsRepository = new SettingsRepository()

function showError(message: string): void {
  pageStatus.textContent = "Page controls are unavailable."
  status.textContent = message
  disablePageButton.disabled = true
}

async function loadStoredSettings(): Promise<void> {
  const settings = await settingsRepository.load()
  enabledControl.checked = settings.enabled
  modeControl.value = settings.mode
}

function responseError(response: ExtensionResponse): string | undefined {
  return response.ok ? undefined : response.error
}

async function loadRuntimeState(): Promise<void> {
  try {
    await loadStoredSettings()
    const response = await sendMessageToActiveTab({ type: "get-runtime-state" })
    const error = responseError(response)

    if (error || !response.ok || !("state" in response)) {
      showError(error ?? "Runtime state is unavailable. Settings remain available")
      return
    }

    pageStatus.textContent = `Page: ${response.state.pageType}`
    enabledControl.checked = response.state.enabled
    modeControl.value = response.state.mode
    disablePageButton.disabled = !["search", "channel", "playlist", "watch", "subscriptions"]
      .includes(response.state.pageType)
  } catch (error) {
    showError(
      "The YouTube page is not connected. Reload the page if you just reloaded the extension",
    )
  }
}

async function saveStoredSetting(
  message: Parameters<typeof sendMessageToActiveTab>[0],
): Promise<void> {
  const settings = await settingsRepository.load()

  if (message.type === "set-enabled") {
    await settingsRepository.save({ ...settings, enabled: message.enabled })
  } else if (message.type === "set-thumbnail-mode") {
    await settingsRepository.save({ ...settings, mode: message.mode })
  }
}

async function update(message: Parameters<typeof sendMessageToActiveTab>[0]): Promise<void> {
  status.textContent = "Saving..."

  try {
    const response = await sendMessageToActiveTab(message)
    const error = responseError(response)
    if (error) {
      if (message.type === "set-enabled" || message.type === "set-thumbnail-mode") {
        await saveStoredSetting(message)
        status.textContent = "Saved. Reload YouTube to apply it"
      } else {
        status.textContent = error
      }
      return
    }
    status.textContent = "Saved"
  } catch (error) {
    if (message.type === "set-enabled" || message.type === "set-thumbnail-mode") {
      await saveStoredSetting(message)
      status.textContent = "Saved. Reload YouTube to apply it"
      return
    }
    status.textContent = error instanceof Error ? error.message : "Communication failed"
  }
}

enabledControl.addEventListener("change", () => {
  void update({ type: "set-enabled", enabled: enabledControl.checked })
})

modeControl.addEventListener("change", () => {
  void update({
    type: "set-thumbnail-mode",
    mode: modeControl.value as "hidden" | "hidden-except-hover" | "blurred" | "solid-color" | "normal",
  })
})

disablePageButton.addEventListener("click", () => {
  void update({ type: "disable-on-current-page" })
})

void loadRuntimeState()
