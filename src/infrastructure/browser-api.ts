export type StorageArea = {
  get(keys?: string | string[] | null): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
}

export type BrowserStorage = {
  sync: StorageArea
}

export function getBrowserStorage(): BrowserStorage {
  const extensionApi = globalThis.browser ?? globalThis.chrome

  if (!extensionApi?.storage?.sync) {
    throw new Error("Browser storage API is unavailable")
  }

  return extensionApi.storage as BrowserStorage
}
