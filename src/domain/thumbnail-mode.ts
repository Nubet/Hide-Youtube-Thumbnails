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
