export type StorageArea = {
  get(keys?: string | string[] | null): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
}

export type BrowserStorage = {
  sync: StorageArea
}

import type { StorageChangeSubscription } from "../shared/contracts"

export function getBrowserStorage(): BrowserStorage {
  const extensionApi = globalThis.browser ?? globalThis.chrome

  if (!extensionApi?.storage?.sync) {
    throw new Error("Browser storage API is unavailable")
  }

  return extensionApi.storage as BrowserStorage
}

export function subscribeToStorageChanges(
  listener: () => void,
): ReturnType<StorageChangeSubscription> {
  const extensionApi = globalThis.browser ?? globalThis.chrome
  const changes = extensionApi?.storage?.onChanged

  if (!changes) return () => undefined

  const handler = () => listener()
  changes.addListener(handler)

  return () => changes.removeListener(handler)
}
