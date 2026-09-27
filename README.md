<div align="center">
  <img src="./icons/icon128.png" alt="Hide YouTube Thumbnails icon" width="96" />

  # Hide Youtube Thumbnails

  Control how YouTube thumbnails are displayed without changing the rest of the page.

  [![Firefox](https://img.shields.io/badge/Firefox-4.0-ff7139?style=flat-square&logo=firefox&logoColor=white)](https://addons.mozilla.org/en-US/firefox/addon/hide-youtube-thumbnails/)
  [![Chrome](https://img.shields.io/badge/Chrome-4.0-4285f4?style=flat-square&logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore/detail/hide-youtube-thumbnails/ljjlnjljgkldhfjfcljljljljljljl)
  [![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285f4?style=flat-square&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)  
  [![License](https://img.shields.io/badge/License-MIT-007acc?style=flat-square)](https://opensource.org/licenses/MIT)
  
[Features](#features) • [Architecture](#architecture)
</div>

`Hide Youtube Thumbnails` is a cross-browser WebExtension for YouTube. It lets you hide, blur, or replace video thumbnails while keeping the surrounding page layout under your control.

## Features

- **Five thumbnail modes**: completely hidden, hidden until hover, blurred, solid color, or normal.
- **Custom solid color**: choose any HEX color to use when the solid-color mode is active.
- **Progressive YouTube support**: covers standard video cards, playlist thumbnails, Shorts thumbnails, newer YouTube thumbnail components, and display ads.
- **Hide Shorts on Home**: removes Shorts shelves and cards from the YouTube home page. Shorts are not hidden on other pages by this setting.
- **Hide Playables**: removes YouTube's Game Room and Playables shelves.
- **Channel exceptions**: show thumbnails on selected channel pages and their `/videos` tabs while keeping them hidden elsewhere.
- **Per-page controls**: disable the extension on search results, channel pages, playlists, watch pages, or subscriptions.



## How It Works

The extension runs a content script on `*.youtube.com` at document start. It classifies the current YouTube view, loads the saved settings, and applies CSS attributes and DOM markers to matching thumbnail or shelf elements.

Thumbnail visibility is controlled with CSS, while Shorts and Playables containers are detected and hidden with selectors that are reapplied when YouTube updates its single-page interface. Settings are kept in `browser.storage.sync` through the WebExtension API. The solid-color picker appears only when that mode is selected.

## Supported YouTube Views

The current page classifier recognizes:

- Home: `/`
- Search: `/results`
- Watch: `/watch`
- Playlist: `/playlist`
- Subscriptions: `/feed/subscriptions`
- Shorts: `/shorts` and `/shorts/...`
- Channels: `/<handle>`, `/channel/...`, `/c/...`, and `/user/...`

Other YouTube paths remain untouched by page-specific settings, although the global thumbnail mode can still apply to recognized thumbnail elements present on those pages.

## Architecture

The project is organized into small layers:

```text
src/
├── domain/          Settings, page policy, modes, and channel rules
├── application/     Runtime orchestration and refresh handling
├── infrastructure/  Browser storage, messaging, and navigation adapters
├── content/         YouTube selectors, styles, Shorts, and Playables handling
├── popup/           Toolbar popup UI
├── options/         Full settings page
└── shared/          Messages and shared contracts
```


## Browser Permissions

The extension declares:

- `storage`: saves settings using browser sync storage.
- `*://*.youtube.com/*` content-script matches: applies the configured presentation rules on YouTube pages.
