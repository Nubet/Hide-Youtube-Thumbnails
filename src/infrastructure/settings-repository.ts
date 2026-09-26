import {
  defaultSettings,
  normalizeSettings,
  type Settings,
} from "../domain/settings"
import {
  getBrowserStorage,
  type BrowserStorage,
} from "./browser-api"

export const SETTINGS_STORAGE_KEY = "settings"

export class SettingsRepository {
  public constructor(
    private readonly storage: BrowserStorage = getBrowserStorage(),
  ) {}

  public async load(): Promise<Settings> {
    const stored = await this.storage.sync.get(SETTINGS_STORAGE_KEY)
    return normalizeSettings(stored[SETTINGS_STORAGE_KEY])
  }

  public async save(settings: unknown): Promise<void> {
    const normalized = normalizeSettings(settings)
    await this.storage.sync.set({
      [SETTINGS_STORAGE_KEY]: normalized,
    })
  }

  public async reset(): Promise<void> {
    await this.save(defaultSettings)
  }
}
