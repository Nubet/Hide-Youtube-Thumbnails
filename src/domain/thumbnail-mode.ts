export const thumbnailModes = [
  "hidden",
  "hidden-except-hover",
  "blurred",
  "solid-color",
  "normal",
] as const

export type ThumbnailMode = (typeof thumbnailModes)[number]

export function isThumbnailMode(value: unknown): value is ThumbnailMode {
  return typeof value === "string" && thumbnailModes.includes(value as ThumbnailMode)
}

export function usesHoverReveal(mode: ThumbnailMode): boolean {
  return mode === "hidden-except-hover" || mode === "blurred" || mode === "solid-color"
}
