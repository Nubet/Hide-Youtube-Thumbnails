import type { RuntimeState } from "../domain/runtime-state"
import type { ThumbnailMode } from "../domain/thumbnail-mode"

export type ExtensionMessage =
  | { type: "get-runtime-state" }
  | { type: "set-enabled"; enabled: boolean }
  | { type: "set-hide-shorts-on-home"; enabled: boolean }
  | { type: "set-thumbnail-mode"; mode: ThumbnailMode }
  | { type: "add-current-channel" }

export type ExtensionResponse =
  | { ok: true; state: RuntimeState }
  | { ok: true }
  | { ok: false; error: string }
