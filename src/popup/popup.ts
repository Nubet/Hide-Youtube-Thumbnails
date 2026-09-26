import { sendMessageToActiveTab } from "../infrastructure/message-bus"
import { SettingsRepository } from "../infrastructure/settings-repository"
import {
  formatChannelVideosUrl,
  parseChannelWhitelistInput,
} from "../domain/channel-whitelist"
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
const channelAction = getRequiredElement<HTMLButtonElement>("#channel-action")
const channelActionHelp = getRequiredElement<HTMLParagraphElement>("#channel-action-help")
const channelUrlInput = getRequiredElement<HTMLInputElement>("#channel-url")
const addChannelButton = getRequiredElement<HTMLButtonElement>("#add-channel")
const channelList = getRequiredElement<HTMLUListElement>("#channel-list")
const settingsRepository = new SettingsRepository()
let whitelistedChannels: string[] = []
let currentChannelKey: string | undefined
let whitelistSaving = false

function showError(message: string): void {
  pageStatus.textContent = "Page controls are unavailable."
  status.textContent = message
  channelAction.disabled = true
  channelActionHelp.textContent = "Open a YouTube channel's Videos tab to add that channel."
}

async function loadStoredSettings(): Promise<void> {
  const settings = await settingsRepository.load()
  enabledControl.checked = settings.enabled
  modeControl.value = settings.mode
  whitelistedChannels = settings.whitelistedChannels
  renderChannelList()
}

function renderChannelList(): void {
  addChannelButton.disabled = whitelistSaving
  channelUrlInput.disabled = whitelistSaving
  channelList.replaceChildren()

  if (whitelistedChannels.length === 0) {
    const empty = document.createElement("li")
    empty.className = "empty-state"
    empty.textContent = "No channel exceptions saved."
    channelList.append(empty)
    renderCurrentChannelAction()
    return
  }

  for (const channelKey of whitelistedChannels) {
    const item = document.createElement("li")
    const url = document.createElement("span")
    const remove = document.createElement("button")

    url.textContent = formatChannelVideosUrl(channelKey)
    remove.type = "button"
    remove.className = "remove-channel"
    remove.textContent = "Remove"
    remove.disabled = whitelistSaving
    remove.setAttribute("aria-label", `Remove ${channelKey}`)
    remove.addEventListener("click", () => {
      void updateWhitelist(whitelistedChannels.filter((item) => item !== channelKey))
    })

    item.append(url, remove)
    channelList.append(item)
  }

  renderCurrentChannelAction()
}

async function updateWhitelist(nextChannels: string[]): Promise<void> {
  const previousChannels = whitelistedChannels
  whitelistedChannels = [...new Set(nextChannels)]
  whitelistSaving = true
  renderChannelList()
  status.textContent = "Saving channel exceptions..."

  try {
    const settings = await settingsRepository.load()
    await settingsRepository.save({ ...settings, whitelistedChannels })
    status.textContent = "Channel exceptions saved"
  } catch {
    whitelistedChannels = previousChannels
    status.textContent = "Could not update channel exceptions"
  } finally {
    whitelistSaving = false
    renderChannelList()
  }
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
    channelAction.textContent = "Open a channel's Videos tab"
    channelActionHelp.textContent =
      "This exception applies only to a specific channel's /videos page."
    return
  }

  if (whitelistedChannels.includes(currentChannelKey)) {
    channelAction.disabled = true
    channelAction.textContent = "Channel already saved"
    channelActionHelp.textContent =
      "Thumbnails are visible on this channel's Videos tab and hidden everywhere else."
    return
  }

  channelAction.disabled = false
  channelAction.textContent = "Show thumbnails for this channel's videos"
  channelActionHelp.textContent =
    "This affects only this channel's /videos page. Home, search, and other channels stay hidden."
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

    pageStatus.textContent = `Page: ${response.state.pageType}`
    enabledControl.checked = response.state.enabled
    modeControl.value = response.state.mode
    renderChannelAction(response.state)
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
    if (message.type === "add-current-channel") {
      await loadStoredSettings()
      channelAction.disabled = true
      channelAction.textContent = "Channel already saved"
      channelActionHelp.textContent =
        "Thumbnails are visible on this channel's Videos tab and hidden everywhere else."
    }
  } catch (error) {
    if (message.type === "set-enabled" || message.type === "set-thumbnail-mode") {
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

channelAction.addEventListener("click", () => {
  channelAction.disabled = true
  channelAction.textContent = "Saving channel exception..."
  void update({ type: "add-current-channel" })
})

addChannelButton.addEventListener("click", () => {
  const channelKey = parseChannelWhitelistInput(channelUrlInput.value)

  if (!channelKey) {
    status.textContent = "Enter a valid YouTube /videos channel URL"
    channelUrlInput.focus()
    return
  }

  if (whitelistedChannels.includes(channelKey)) {
    status.textContent = "This channel is already saved"
    return
  }

  channelUrlInput.value = ""
  void updateWhitelist([...whitelistedChannels, channelKey])
})

void loadRuntimeState()
