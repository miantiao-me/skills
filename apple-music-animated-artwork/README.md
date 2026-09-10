# Apple Music Animated Artwork Downloader

[简体中文](./README.zh-CN.md) · [Skill Index](../README.md)

Lightweight Node.js CLI to search Apple Music albums and download available animated artwork (Editorial Video) as MP4 video files.

## Installation

```bash
# Install into AI agent (add -g for global)
npx skills add miantiao-me/skills --skill apple-music-animated-artwork
```

Installed agents load [`SKILL.md`](SKILL.md) to query the Catalog API, inspect square/tall variants, confirm resolution, and download MP4 files.

## Requirements and Authentication

- **Node.js 20+**, with system `ffmpeg` on `PATH` (`ffprobe` recommended for verification).
- Zero npm dependencies; no `npm install` required.
- Run all CLI commands directly from this `apple-music-animated-artwork` directory.

### Authentication Options

Set an official Apple Music Developer Token (recommended):

```bash
export APPLE_MUSIC_DEVELOPER_TOKEN='<your-developer-token>'
```

Alternatively, pass `--experimental-web-token` to obtain a temporary web bearer token at runtime.

## Quick Start (CLI)

```bash
# 1. Search for albums
node scripts/apple-music-artwork.mjs search "Pink Floyd The Dark Side of the Moon" --storefront us --limit 5 --json

# 2. Inspect available artwork variants and resolutions
node scripts/apple-music-artwork.mjs inspect 1665303755 --storefront us

# 3. Download square animated artwork (best quality)
node scripts/apple-music-artwork.mjs download 1665303755 --variant square --resolution best
```

Run `node scripts/apple-music-artwork.mjs help` for all options, custom resolutions, and tall variants.

## Limitations and Licensing

- **API Boundaries**: Metadata lookup uses Apple's official Catalog API. Animated artwork relies on undocumented web fields (`extend=editorialVideo`, `motionDetailSquare`, etc.) that may change without notice.
- **No DRM Bypass**: Downloads only unencrypted HLS streams; does not bypass DRM or regional restrictions.
- **Copyright**: Tooling is licensed under the root [MIT License](../LICENSE). Downloaded media remains the property of Apple or respective copyright holders and is not licensed for redistribution. See [API and Auth References](./references/api-and-auth.md).
