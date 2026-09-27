import type { RuntimeState } from "../domain/runtime-state"
import type { ThumbnailMode } from "../domain/thumbnail-mode"
import type { HoverDelay } from "../domain/hover-delay"

export type ExtensionMessage =
  | { type: "get-runtime-state" }
  | { type: "set-enabled"; enabled: boolean }
  | { type: "set-hide-shorts-on-home"; enabled: boolean }
  | { type: "set-hide-playables"; enabled: boolean }
  | { type: "set-thumbnail-mode"; mode: ThumbnailMode }
  | { type: "set-solid-color"; color: string }
  | { type: "set-hover-delay"; delay: HoverDelay }
  | { type: "set-autoplay-preview"; enabled: boolean }
  | { type: "add-current-channel" }

export type ExtensionResponse =
  | { ok: true; state: RuntimeState }
  | { ok: true }
  | { ok: false; error: string }
