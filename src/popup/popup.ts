import { sendMessageToActiveTab } from "../infrastructure/message-bus"
import { SettingsRepository } from "../infrastructure/settings-repository"
import { DEFAULT_SOLID_COLOR, defaultSettings } from "../domain/settings"
import { usesHoverReveal } from "../domain/thumbnail-mode"
import {
  formatChannelVideosUrl,
  parseChannelWhitelistInput,
} from "../domain/channel-whitelist"
import type { ExtensionResponse } from "../shared/messages"
import { disableablePages, pageLabels, type DisableablePage } from "../domain/page-type"

function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) throw new Error(`Missing popup element: ${selector}`)
  return element
}

const enabledControl = getRequiredElement<HTMLInputElement>("#enabled")
const modeControl = getRequiredElement<HTMLSelectElement>("#mode")
const solidColorControl = getRequiredElement<HTMLDivElement>("#solid-color-control")
const solidColorInput = getRequiredElement<HTMLInputElement>("#solid-color")
const solidColorValue = getRequiredElement<HTMLOutputElement>("#solid-color-value")
const hoverDelayControl = getRequiredElement<HTMLDivElement>("#hover-delay-control")
const hoverDelayInput = getRequiredElement<HTMLSelectElement>("#hover-delay")
const hoverPreviewControl = getRequiredElement<HTMLLabelElement>("#hover-preview-control")
const autoplayPreviewInput = getRequiredElement<HTMLInputElement>("#autoplay-preview")
const hideShortsOnHomeControl = getRequiredElement<HTMLInputElement>("#hide-shorts-on-home")
const hidePlayablesControl = getRequiredElement<HTMLInputElement>("#hide-playables")
const currentPageControl = getRequiredElement<HTMLLabelElement>("#current-page-control")
const currentPageTitle = getRequiredElement<HTMLHeadingElement>("#current-page-title")
const currentPageHelp = getRequiredElement<HTMLParagraphElement>("#current-page-help")
const currentPageEnabled = getRequiredElement<HTMLInputElement>("#current-page-enabled")
const pageList = getRequiredElement<HTMLDivElement>("#page-list")
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
  solidColorInput.value = settings.solidColor
  hoverDelayInput.value = settings.hoverDelay
  autoplayPreviewInput.checked = settings.autoplayPreview
  hideShortsOnHomeControl.checked = settings.hideShortsOnHome
  hidePlayablesControl.checked = settings.hidePlayables
  storedSettings = settings
  whitelistedChannels = settings.whitelistedChannels
  renderPageExceptions()
  renderChannelList()
  renderModeControls()
}

function renderPageExceptions(): void {
  pageList.replaceChildren()

  for (const page of disableablePages) {
    const label = document.createElement("label")
    const content = document.createElement("span")
    const title = document.createElement("span")
    const description = document.createElement("small")
    const toggle = document.createElement("span")
    const input = document.createElement("input")
    const slider = document.createElement("span")

    label.className = "setting-item"
    content.className = "setting-content"
    title.className = "setting-title"
    description.className = "setting-desc"
    toggle.className = "toggle"
    input.type = "checkbox"
    input.checked = !storedSettings.disabledPages[page]
    input.setAttribute("aria-label", `Run on ${pageLabels[page]}`)
    slider.className = "slider"
    title.textContent = pageLabels[page]
    description.textContent = storedSettings.disabledPages[page] ? "Disabled" : "Enabled"

    input.addEventListener("change", () => {
      void update({ type: "set-page-enabled", page, enabled: input.checked })
    })

    content.append(title, description)
    toggle.append(input, slider)
    label.append(content, toggle)
    pageList.append(label)
  }
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

function renderModeControls(): void {
  const isSolidColor = modeControl.value === "solid-color"
  solidColorControl.hidden = !isSolidColor
  solidColorValue.value = solidColorInput.value.toUpperCase()
  const mode = modeControl.value as Parameters<typeof usesHoverReveal>[0]
  const hasHoverReveal = usesHoverReveal(mode)
  hoverDelayControl.hidden = !hasHoverReveal
  hoverPreviewControl.hidden = !hasHoverReveal
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
    solidColorInput.value = response.state.solidColor || DEFAULT_SOLID_COLOR
    hoverDelayInput.value = response.state.hoverDelay
    autoplayPreviewInput.checked = response.state.autoplayPreview
    renderModeControls()
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
  } else if (message.type === "set-hide-shorts-on-home") {
    await settingsRepository.save({ ...settings, hideShortsOnHome: message.enabled })
  } else if (message.type === "set-hide-playables") {
    await settingsRepository.save({ ...settings, hidePlayables: message.enabled })
  } else if (message.type === "set-thumbnail-mode") {
    await settingsRepository.save({ ...settings, mode: message.mode })
  } else if (message.type === "set-solid-color") {
    await settingsRepository.save({ ...settings, solidColor: message.color })
  } else if (message.type === "set-hover-delay") {
    await settingsRepository.save({ ...settings, hoverDelay: message.delay })
  } else if (message.type === "set-autoplay-preview") {
    await settingsRepository.save({ ...settings, autoplayPreview: message.enabled })
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
    renderPageExceptions()
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
  renderModeControls()
  void update({
    type: "set-thumbnail-mode",
    mode: modeControl.value as "hidden" | "hidden-except-hover" | "blurred" | "solid-color" | "normal",
  })
})

hoverDelayInput.addEventListener("change", () => {
  void update({
    type: "set-hover-delay",
    delay: hoverDelayInput.value as "instant" | "brief" | "patient",
  })
})

autoplayPreviewInput.addEventListener("change", () => {
  void update({ type: "set-autoplay-preview", enabled: autoplayPreviewInput.checked })
})

solidColorInput.addEventListener("input", () => {
  solidColorValue.value = solidColorInput.value.toUpperCase()
})

solidColorInput.addEventListener("change", () => {
  void update({ type: "set-solid-color", color: solidColorInput.value })
})

hideShortsOnHomeControl.addEventListener("change", () => {
  void update({ type: "set-hide-shorts-on-home", enabled: hideShortsOnHomeControl.checked })
})

hidePlayablesControl.addEventListener("change", () => {
  void update({ type: "set-hide-playables", enabled: hidePlayablesControl.checked })
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

addChannelButton.addEventListener("click", () => {
  const channelKey = parseChannelWhitelistInput(channelUrlInput.value)

  if (!channelKey) {
    status.textContent = "Enter a valid YouTube channel URL"
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
