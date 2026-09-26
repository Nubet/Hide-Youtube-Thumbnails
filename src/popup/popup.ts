import { sendMessageToActiveTab } from "../infrastructure/message-bus"
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

function showError(message: string): void {
  pageStatus.textContent = "This page is unavailable."
  status.textContent = message
  enabledControl.disabled = true
  modeControl.disabled = true
  disablePageButton.disabled = true
}

function responseError(response: ExtensionResponse): string | undefined {
  return response.ok ? undefined : response.error
}

async function loadRuntimeState(): Promise<void> {
  try {
    const response = await sendMessageToActiveTab({ type: "get-runtime-state" })
    const error = responseError(response)

    if (error || !response.ok || !("state" in response)) {
      showError(error ?? "Runtime state is unavailable")
      return
    }

    pageStatus.textContent = `Page: ${response.state.pageType}`
    enabledControl.checked = response.state.enabled
    modeControl.value = response.state.mode
    disablePageButton.disabled = !["search", "channel", "playlist", "watch", "subscriptions"]
      .includes(response.state.pageType)
  } catch (error) {
    showError(error instanceof Error ? error.message : "Communication failed")
  }
}

async function update(message: Parameters<typeof sendMessageToActiveTab>[0]): Promise<void> {
  status.textContent = "Saving..."

  try {
    const response = await sendMessageToActiveTab(message)
    const error = responseError(response)
    status.textContent = error ?? "Saved"
  } catch (error) {
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
