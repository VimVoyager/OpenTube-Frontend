# Changelog

All notable changes to this service are documented here.

The format is based on [keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). See [VERSIONING.md](VERSIONING.md) for how versions are chosen and released.

## [Unreleased]

### Added

- "Load more" button on search results, using the search API's next-page endpoint to fetch and append additional results without a full page reload.
- "Load more" button on channel pages, using the channel API's next-page endpoint to fetch and append further uploads without a full page reload.

## [0.2.0] - 2026-08-27

### Added

- Landing page showing trending videos from gaming, music, movies and shows, and podcast feeds.

### Changed

- Base image moved from Node 20 to Node 24 LTS. Node 20 reached end of life in April 2026.
- Updated dependencies, including major versions of Vite, ESLint, jsdom, and the test tooling.
- Removed the unused `@sveltejs/adapter-auto` dependency.
- Video thumbnails now use the highest resolution the source provides.

## [0.1.1] - 2026-08-16

### Fixed

- Video playback now continues across desktop, mobile, and fullscreen layouts. The watch route mounted two players and only hid one with CSS, so each layout could be started independently.
- Watch pages no longer fetch the DASH manifest and buffer segments twice - a side effect of the duplicate player.
- Navigating between videos reloads the player in place instead of rebuilding it.
- Fixed a teardown race condition that could produce intermittent errors when navigating away from a video.

[Unreleased]: https://github.com/VimVoyager/OpenTube-Frontend/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/VimVoyager/OpenTube-Frontend/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/VimVoyager/OpenTube-Frontend/compare/v0.1.0...v0.1.1
