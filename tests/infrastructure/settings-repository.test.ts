import { describe, expect, it, vi } from "vitest"
import {
  SETTINGS_STORAGE_KEY,
  SettingsRepository,
} from "../../src/infrastructure/settings-repository"

function createStorage(initialValue?: unknown) {
  let value = initialValue

  return {
    sync: {
      get: vi.fn(async () => ({ [SETTINGS_STORAGE_KEY]: value })),
      set: vi.fn(async (items: Record<string, unknown>) => {
        value = items[SETTINGS_STORAGE_KEY]
      }),
    },
  }
}

describe("SettingsRepository", () => {
  it("loads normalized settings from sync storage", async () => {
    const storage = createStorage({ enabled: false })
    const repository = new SettingsRepository(storage)

    await expect(repository.load()).resolves.toMatchObject({
      enabled: false,
      mode: "hidden",
    })
    expect(storage.sync.get).toHaveBeenCalledWith(SETTINGS_STORAGE_KEY)
  })

  it("normalizes settings before saving", async () => {
    const storage = createStorage()
    const repository = new SettingsRepository(storage)

    await repository.save({ mode: "blurred" })

    expect(storage.sync.set).toHaveBeenCalledWith({
      settings: expect.objectContaining({
        schemaVersion: 2,
        enabled: true,
        mode: "blurred",
      }),
    })
  })

  it("propagates storage errors", async () => {
    const storage = createStorage()
    storage.sync.get.mockRejectedValueOnce(new Error("storage unavailable"))
    const repository = new SettingsRepository(storage)

    await expect(repository.load()).rejects.toThrow("storage unavailable")
  })
})
