import { isThumbnailMode, type ThumbnailMode } from "./thumbnail-mode"

export const SETTINGS_SCHEMA_VERSION = 1 as const

export type DisabledPages = {
  search: boolean
  channel: boolean
  playlist: boolean
  watch: boolean
  subscriptions: boolean
}

export type Settings = {
  schemaVersion: typeof SETTINGS_SCHEMA_VERSION
  enabled: boolean
  hideShortsOnHome: boolean
  hidePlayables: boolean
  mode: ThumbnailMode
  disabledPages: DisabledPages
  whitelistedChannels: string[]
}

export const defaultSettings: Settings = {
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  enabled: true,
  hideShortsOnHome: true,
  hidePlayables: true,
  mode: "hidden",
  disabledPages: {
    search: false,
    channel: false,
    playlist: false,
    watch: false,
    subscriptions: false,
  },
  whitelistedChannels: [],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

function readDisabledPages(value: unknown): DisabledPages {
  const input = isRecord(value) ? value : {}

  return {
    search: readBoolean(input.search, defaultSettings.disabledPages.search),
    channel: readBoolean(input.channel, defaultSettings.disabledPages.channel),
    playlist: readBoolean(input.playlist, defaultSettings.disabledPages.playlist),
    watch: readBoolean(input.watch, defaultSettings.disabledPages.watch),
    subscriptions: readBoolean(
      input.subscriptions,
      defaultSettings.disabledPages.subscriptions,
    ),
  }
}

function readWhitelistedChannels(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return [...new Set(value.filter((item): item is string => typeof item === "string"))]
}

export function normalizeSettings(value: unknown): Settings {
  if (!isRecord(value)) return structuredClone(defaultSettings)

  const schemaVersion = value.schemaVersion
  if (schemaVersion !== undefined && schemaVersion !== SETTINGS_SCHEMA_VERSION) {
    return structuredClone(defaultSettings)
  }

  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    enabled: readBoolean(value.enabled, defaultSettings.enabled),
    hideShortsOnHome: readBoolean(value.hideShortsOnHome, defaultSettings.hideShortsOnHome),
    hidePlayables: readBoolean(value.hidePlayables, defaultSettings.hidePlayables),
    mode: isThumbnailMode(value.mode) ? value.mode : defaultSettings.mode,
    disabledPages: readDisabledPages(value.disabledPages),
    whitelistedChannels: readWhitelistedChannels(value.whitelistedChannels),
  }
}
