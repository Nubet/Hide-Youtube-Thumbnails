export const hoverDelays = ["instant", "brief", "patient"] as const

export type HoverDelay = (typeof hoverDelays)[number]

export const hoverDelayMilliseconds: Record<HoverDelay, number> = {
  instant: 0,
  brief: 250,
  patient: 700,
}

export function isHoverDelay(value: unknown): value is HoverDelay {
  return typeof value === "string" && hoverDelays.includes(value as HoverDelay)
}
