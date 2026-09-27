import { sendMessageToActiveTab } from "../infrastructure/message-bus"
import { SettingsRepository } from "../infrastructure/settings-repository"
import { defaultSettings } from "../domain/settings"
import type { ExtensionResponse } from "../shared/messages"
import { disableablePages, pageLabels, type DisableablePage } from "../domain/page-type"

function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) throw new Error(`Missing popup element: ${selector}`)
  return element
}

const enabledControl = getRequiredElement<HTMLInputElement>("#enabled")
const modeControl = getRequiredElement<HTMLSelectElement>("#mode")
const currentPageControl = getRequiredElement<HTMLLabelElement>("#current-page-control")
const currentPageTitle = getRequiredElement<HTMLHeadingElement>("#current-page-title")
const currentPageHelp = getRequiredElement<HTMLParagraphElement>("#current-page-help")
const currentPageEnabled = getRequiredElement<HTMLInputElement>("#current-page-enabled")
const status = getRequiredElement<HTMLParagraphElement>("#status")
const channelAction = getRequiredElement<HTMLButtonElement>("#channel-action")
const channelActionHelp = getRequiredElement<HTMLParagraphElement>("#channel-action-help")
const openOptionsButton = getRequiredElement<HTMLButtonElement>("#open-options")

const settingsRepository = new SettingsRepository()
let whitelistedChannels: string[] = []
let currentChannelKey: string | undefined
let whitelistSaving = false
let currentPage: DisableablePage | undefined
let storedSettings = structuredClone(defaultSettings)

function showError(message: string): void {
  status.textContent = message
  channelAction.disabled = true
  channelActionHelp.textContent = "Open a YouTube channel page or its Videos tab to add that channel."
}

async function loadStoredSettings(): Promise<void> {
  const settings = await settingsRepository.load()
  enabledControl.checked = settings.enabled
  modeControl.value = settings.mode
  storedSettings = settings
  whitelistedChannels = settings.whitelistedChannels
}

function renderCurrentPage(): void {
  if (!currentPage) {
    currentPageControl.hidden = true
    currentPageTitle.textContent = "This page is not managed"
    currentPageHelp.textContent = "Page-specific controls are available on supported YouTube views."
    return
  }

  currentPageControl.hidden = false
  currentPageTitle.textContent = pageLabels[currentPage]
  currentPageEnabled.checked = !storedSettings.disabledPages[currentPage]
  currentPageHelp.textContent = currentPageEnabled.checked
    ? "The extension is active here. Turn it off for this page only."
    : "The extension is disabled here. Turn it on to show the configured thumbnail behavior."
}

function responseError(response: ExtensionResponse): string | undefined {
  return response.ok ? undefined : response.error
}

function renderCurrentChannelAction(): void {
  if (whitelistSaving) {
    channelAction.disabled = true
    channelAction.textContent = "Saving channel exception..."
    return
  }

  if (!currentChannelKey) {
    channelAction.disabled = true
    channelAction.textContent = "Open a channel page"
    channelActionHelp.textContent =
      "Open the channel home page or its /videos tab to add an exception."
    return
  }

  if (whitelistedChannels.includes(currentChannelKey)) {
    channelAction.disabled = true
    channelAction.textContent = "Channel already saved"
    channelActionHelp.textContent =
      "Thumbnails are visible on this channel home page and its Videos tab."
    return
  }

  channelAction.disabled = false
  channelAction.textContent = "Show thumbnails for this channel's videos"
  channelActionHelp.textContent =
    "This affects only this channel home page and its /videos tab. Home, search, and other channels stay hidden."
}

function renderChannelAction(state: Extract<ExtensionResponse, { ok: true; state: unknown }>["state"]): void {
  currentChannelKey = state.channelVideosKey
  renderCurrentChannelAction()
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

    enabledControl.checked = response.state.enabled
    modeControl.value = response.state.mode
    currentPage = disableablePages.includes(response.state.pageType as DisableablePage)
      ? response.state.pageType as DisableablePage
      : undefined
    renderCurrentPage()
    renderChannelAction(response.state)
  } catch {
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
  } else if (message.type === "set-page-enabled") {
    await settingsRepository.save({
      ...settings,
      disabledPages: { ...settings.disabledPages, [message.page]: !message.enabled },
    })
  }
}

async function update(message: Parameters<typeof sendMessageToActiveTab>[0]): Promise<void> {
  status.textContent = "Saving..."

  try {
    const response = await sendMessageToActiveTab(message)
    const error = responseError(response)
    if (error) {
      if (message.type !== "add-current-channel") {
        await saveStoredSetting(message)
        status.textContent = "Saved. Reload YouTube to apply it"
      } else {
        status.textContent = error
      }
      return
    }
    status.textContent = "Saved"
    storedSettings = await settingsRepository.load()
    renderCurrentPage()
    if (message.type === "add-current-channel") {
      await loadStoredSettings()
      channelAction.disabled = true
      channelAction.textContent = "Channel already saved"
      channelActionHelp.textContent =
        "Thumbnails are visible on this channel home page and its Videos tab."
    }
  } catch (error) {
    if (message.type !== "add-current-channel") {
      await saveStoredSetting(message)
      status.textContent = "Saved. Reload YouTube to apply it"
      return
    }
    status.textContent = error instanceof Error ? error.message : "Communication failed"
  } finally {
    if (message.type === "add-current-channel" && !whitelistSaving) {
      renderCurrentChannelAction()
    }
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

currentPageEnabled.addEventListener("change", () => {
  if (!currentPage) return
  void update({ type: "set-page-enabled", page: currentPage, enabled: currentPageEnabled.checked })
})

channelAction.addEventListener("click", () => {
  channelAction.disabled = true
  channelAction.textContent = "Saving channel exception..."
  void update({ type: "add-current-channel" })
})

openOptionsButton.addEventListener("click", () => {
  const extensionApi = globalThis.browser ?? globalThis.chrome
  if (extensionApi?.runtime?.openOptionsPage) {
    extensionApi.runtime.openOptionsPage()
  } else {
    window.open("options.html")
  }
})

void loadRuntimeState()
