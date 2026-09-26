import type { RuntimeState } from "../domain/runtime-state"
import {
  thumbnailSelectors,
  type ThumbnailSelectorGroup,
} from "./selector-registry"

export type DiagnosticsRoot = {
  querySelectorAll(selector: string): Iterable<Element>
}

export type DiagnosticsSnapshot = {
  pageType: RuntimeState["pageType"]
  mode: RuntimeState["mode"] | "normal"
  enabled: boolean
  knownThumbnailCount: number
  selectorCounts: Record<ThumbnailSelectorGroup, number>
  lastNavigation: string
}

function countGroupMatches(
  root: DiagnosticsRoot,
  selectors: readonly string[],
): number {
  const elements = new Set<Element>()

  for (const selector of selectors) {
    try {
      for (const element of root.querySelectorAll(selector)) {
        elements.add(element)
      }
    } catch {
      // A broken selector must not affect extension behavior
    }
  }

  return elements.size
}

export function collectDiagnostics(
  root: DiagnosticsRoot,
  state: RuntimeState,
  lastNavigation: string,
): DiagnosticsSnapshot {
  const selectorCounts = {
    standard: countGroupMatches(root, thumbnailSelectors.standard),
    playlists: countGroupMatches(root, thumbnailSelectors.playlists),
    shorts: countGroupMatches(root, thumbnailSelectors.shorts),
    modern: countGroupMatches(root, thumbnailSelectors.modern),
    ads: countGroupMatches(root, thumbnailSelectors.ads),
  }

  return {
    pageType: state.pageType,
    mode: state.enabled ? state.mode : "normal",
    enabled: state.enabled,
    knownThumbnailCount: Object.values(selectorCounts).reduce(
      (total, count) => total + count,
      0,
    ),
    selectorCounts,
    lastNavigation,
  }
}

export class Diagnostics {
  public constructor(private readonly root: DiagnosticsRoot) {}

  public record(
    state: RuntimeState,
    lastNavigation: string,
  ): DiagnosticsSnapshot {
    const snapshot = collectDiagnostics(this.root, state, lastNavigation)
    console.debug("[hide-youtube-thumbnails] runtime diagnostics", snapshot)
    return snapshot
  }
}
