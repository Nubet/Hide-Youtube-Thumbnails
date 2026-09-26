import {
  defaultSettings,
  type Settings,
} from "../domain/settings"
import { isThumbnailMode, type ThumbnailMode } from "../domain/thumbnail-mode"
import { SettingsRepository } from "../infrastructure/settings-repository"
import {
  formatChannelVideosUrl,
  parseChannelWhitelistInput,
} from "../domain/channel-whitelist"
import { mergeOptions } from "./options-state"

function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) throw new Error(`Missing options element: ${selector}`)
  return element
}

const form = getRequiredElement<HTMLFormElement>("#settings-form")
const enabledControl = getRequiredElement<HTMLInputElement>("#enabled")
const hideShortsOnHomeControl = getRequiredElement<HTMLInputElement>("#hide-shorts-on-home")
const status = getRequiredElement<HTMLParagraphElement>("#status")
const resetButton = getRequiredElement<HTMLButtonElement>("#reset")
const channelUrlInput = getRequiredElement<HTMLInputElement>("#channel-url")
const addChannelButton = getRequiredElement<HTMLButtonElement>("#add-channel")
const whitelistList = getRequiredElement<HTMLUListElement>("#whitelist-list")

const repository = new SettingsRepository()
let whitelistedChannels: string[] = []

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
  hideShortsOnHomeControl.checked = settings.hideShortsOnHome
  setMode(settings.mode)
  getCheckbox("disable-search").checked = settings.disabledPages.search
  getCheckbox("disable-channel").checked = settings.disabledPages.channel
  getCheckbox("disable-playlist").checked = settings.disabledPages.playlist
  getCheckbox("disable-watch").checked = settings.disabledPages.watch
  getCheckbox("disable-subscriptions").checked = settings.disabledPages.subscriptions
  whitelistedChannels = [...settings.whitelistedChannels]
  renderWhitelist()
}

function renderWhitelist(): void {
  whitelistList.replaceChildren()

  if (whitelistedChannels.length === 0) {
    const empty = document.createElement("li")
    empty.className = "empty-state"
    empty.textContent = "No channels added yet."
    whitelistList.append(empty)
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
    remove.setAttribute("aria-label", `Remove ${channelKey}`)
    remove.addEventListener("click", () => {
      void updateWhitelist(whitelistedChannels.filter((item) => item !== channelKey))
    })

    item.append(url, remove)
    whitelistList.append(item)
  }
}

async function updateWhitelist(nextChannels: string[]): Promise<void> {
  try {
    const current = await repository.load()
    whitelistedChannels = [...new Set(nextChannels)]
    await repository.save({ ...current, whitelistedChannels })
    renderWhitelist()
    status.textContent = "Channel list updated"
  } catch {
    status.textContent = "Could not update channel list"
  }
}

function readSettings(current: Settings): Settings {
  return mergeOptions(current, {
    enabled: enabledControl.checked,
    hideShortsOnHome: hideShortsOnHomeControl.checked,
    mode: getModeControl().value as ThumbnailMode,
      disabledPages: {
      search: getCheckbox("disable-search").checked,
      channel: getCheckbox("disable-channel").checked,
      playlist: getCheckbox("disable-playlist").checked,
      watch: getCheckbox("disable-watch").checked,
        subscriptions: getCheckbox("disable-subscriptions").checked,
      },
      whitelistedChannels,
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

addChannelButton.addEventListener("click", () => {
  const channelKey = parseChannelWhitelistInput(channelUrlInput.value)

  if (!channelKey) {
    status.textContent = "Enter a valid YouTube channel /videos URL"
    channelUrlInput.focus()
    return
  }

  if (whitelistedChannels.includes(channelKey)) {
    status.textContent = "This channel is already on the list"
    return
  }

  channelUrlInput.value = ""
  void updateWhitelist([...whitelistedChannels, channelKey])
})

void loadSettings()
