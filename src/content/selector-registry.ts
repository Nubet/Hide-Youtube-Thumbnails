export const thumbnailSelectors = {
  standard: [
    "ytd-video-renderer ytd-thumbnail",
    "ytd-grid-video-renderer ytd-thumbnail",
    "ytd-rich-item-renderer ytd-thumbnail",
  ],

  playlists: [
    "ytd-playlist-video-renderer ytd-thumbnail",
    "ytd-playlist-thumbnail",
  ],

  shorts: [
    ".shortsLockupViewModelHostThumbnailContainer",
    "ytm-reel-item-renderer .video-thumbnail-container-vertical",
  ],

  modern: [
    "yt-thumbnail-view-model",
    ".yt-lockup-view-model-wiz__content-image",
  ],

  ads: [
    "ytd-display-ad-renderer #media-container",
  ],
} as const

export type ThumbnailSelectorGroup = keyof typeof thumbnailSelectors

export const allThumbnailSelectors = Object.values(thumbnailSelectors).flat()
