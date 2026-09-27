import type { RuntimeState } from "../domain/runtime-state"

const previewVideoSelector = [
  "ytd-rich-item-renderer video",
  "ytd-grid-video-renderer video",
  "ytd-playlist-video-renderer video",
  "ytd-video-renderer video",
  "ytd-thumbnail video",
  "ytd-playlist-thumbnail video",
  "yt-thumbnail-view-model video",
  ".yt-lockup-view-model-wiz__content-image video",
  "ytm-shorts-lockup-view-model video",
  "ytd-moving-thumbnail-renderer video",
  "#video-preview video",
].join(",")

const previewContainerSelector = [
  "#video-preview",
  "ytd-moving-thumbnail-renderer",
  "ytd-rich-item-renderer",
  "ytd-grid-video-renderer",
  "ytd-playlist-video-renderer",
  "ytd-video-renderer",
  "ytm-shorts-lockup-view-model",
].join(",")

export class HoverPreviewState {
  private observer: MutationObserver | undefined

  public constructor(private readonly root: Document) {}

  public apply(state: RuntimeState): void {
    this.clear()

    if (!state.enabled || state.mode !== "hidden-except-hover" || state.autoplayPreview) {
      return
    }

    this.pausePreviewVideos()
    this.root.addEventListener("play", this.handlePlay, true)
    this.observer = new MutationObserver(() => this.pausePreviewVideos())
    this.observer.observe(this.root.documentElement, {
      childList: true,
      subtree: true,
    })
  }

  public clear(): void {
    this.observer?.disconnect()
    this.observer = undefined
    this.root.removeEventListener("play", this.handlePlay, true)
  }

  private readonly handlePlay = (event: Event): void => {
    const target = event.target
    if (
      target instanceof HTMLVideoElement &&
      (target.matches(previewVideoSelector) || target.closest(previewContainerSelector))
    ) {
      target.pause()
    }
  }

  private pausePreviewVideos(): void {
    for (const video of this.root.querySelectorAll<HTMLVideoElement>(previewVideoSelector)) {
      video.pause()
      video.removeAttribute("autoplay")
    }
  }
}
