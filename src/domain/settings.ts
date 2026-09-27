import { isThumbnailMode, type ThumbnailMode } from "./thumbnail-mode"
import { isHoverDelay, type HoverDelay } from "./hover-delay"
import { disableablePages, type DisableablePage } from "./page-type"

export const SETTINGS_SCHEMA_VERSION = 2 as const
export const DEFAULT_SOLID_COLOR = "#e5e5ea" as const

export type DisabledPages = Record<DisableablePage, boolean>

export type Settings = {
  schemaVersion: typeof SETTINGS_SCHEMA_VERSION
  enabled: boolean
  hideShortsOnHome: boolean
  hidePlayables: boolean
  mode: ThumbnailMode
  solidColor: string
  hoverDelay: HoverDelay
  autoplayPreview: boolean
  disabledPages: DisabledPages
  whitelistedChannels: string[]
}

export const defaultSettings: Settings = {
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  enabled: true,
  hideShortsOnHome: true,
  hidePlayables: true,
  mode: "hidden",
  solidColor: DEFAULT_SOLID_COLOR,
  hoverDelay: "instant",
  autoplayPreview: false,
  disabledPages: Object.fromEntries(disableablePageEntries()) as DisabledPages,
  whitelistedChannels: [],
}

function disableablePageEntries(): Array<[DisableablePage, boolean]> {
  return disableablePages.map((page) => [page, false])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

function readSolidColor(value: unknown): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value.toLowerCase()
    : defaultSettings.solidColor
}

function readDisabledPages(value: unknown): DisabledPages {
  const input = isRecord(value) ? value : {}
  const legacy = {
    search: input.search,
    watch: input.watch,
    playlist: input.playlist,
    subscriptions: input.subscriptions,
  }

  return {
    ...defaultSettings.disabledPages,
    home: readBoolean(input.home, false),
    search: readBoolean(legacy.search, false),
    watch: readBoolean(legacy.watch, false),
    playlist: readBoolean(legacy.playlist, false),
    subscriptions: readBoolean(legacy.subscriptions, false),
    "channel-home": readBoolean(input["channel-home"], input.channel === true),
    "channel-videos": readBoolean(input["channel-videos"], input.channel === true),
    "channel-streams": readBoolean(input["channel-streams"], input.channel === true),
    trending: readBoolean(input.trending, false),
    history: readBoolean(input.history, false),
    explore: readBoolean(input.explore, false),
    gaming: readBoolean(input.gaming, false),
    music: readBoolean(input.music, false),
    live: readBoolean(input.live, false),
  }
}

function readWhitelistedChannels(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return [...new Set(value.filter((item): item is string => typeof item === "string"))]
}

export function normalizeSettings(value: unknown): Settings {
  if (!isRecord(value)) return structuredClone(defaultSettings)

  const schemaVersion = value.schemaVersion
  if (schemaVersion !== undefined && schemaVersion !== 1 && schemaVersion !== SETTINGS_SCHEMA_VERSION) {
    return structuredClone(defaultSettings)
  }

  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    enabled: readBoolean(value.enabled, defaultSettings.enabled),
    hideShortsOnHome: readBoolean(value.hideShortsOnHome, defaultSettings.hideShortsOnHome),
    hidePlayables: readBoolean(value.hidePlayables, defaultSettings.hidePlayables),
    mode: isThumbnailMode(value.mode) ? value.mode : defaultSettings.mode,
    solidColor: readSolidColor(value.solidColor),
    hoverDelay: isHoverDelay(value.hoverDelay) ? value.hoverDelay : defaultSettings.hoverDelay,
    autoplayPreview: readBoolean(value.autoplayPreview, defaultSettings.autoplayPreview),
    disabledPages: readDisabledPages(value.disabledPages),
    whitelistedChannels: readWhitelistedChannels(value.whitelistedChannels),
  }
}
