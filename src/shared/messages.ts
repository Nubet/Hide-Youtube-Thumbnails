import type { RuntimeState } from "../domain/runtime-state"
import type { ThumbnailMode } from "../domain/thumbnail-mode"

export type ExtensionMessage =
  | { type: "get-runtime-state" }
  | { type: "set-enabled"; enabled: boolean }
  | { type: "set-thumbnail-mode"; mode: ThumbnailMode }
  | { type: "disable-on-current-page" }

export type ExtensionResponse =
  | { ok: true; state: RuntimeState }
  | { ok: true }
  | { ok: false; error: string }
