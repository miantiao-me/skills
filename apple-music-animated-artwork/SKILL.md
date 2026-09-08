---
name: apple-music-animated-artwork
description: Search Apple Music by artist and album, then inspect or download animated artwork. Use when a user names an artist and album or asks for Apple Music 动态封面, including checking square/tall variants, choosing resolutions, and downloading HLS artwork to MP4.
---

# Apple Music Animated Artwork

Use the zero-dependency Node.js 20+ CLI at `scripts/apple-music-artwork.mjs` from this Skill directory.

## Authenticate

Set an Apple Music developer token for the documented Catalog API:

```bash
export APPLE_MUSIC_DEVELOPER_TOKEN='<developer-token>'
```

Prefer this method. Never print, persist, or embed a token.

Only when the user explicitly approves experimental Web authentication, add `--experimental-web-token`. This mode discovers the current public Apple Web bearer token at runtime and uses the Apple Music Web client host. Treat it as unofficial and best-effort.

## Artist + album quick workflow

Search with both names and inspect the selected album:

```bash
node scripts/apple-music-artwork.mjs search "Pink Floyd The Dark Side of the Moon 50th Anniversary" --storefront us --limit 5 --json
node scripts/apple-music-artwork.mjs inspect 1665303755 --storefront us
```

Select an album only when `artistName` and album name give one exact or unambiguous match. If multiple candidates remain, show them and ask the user to select one; never guess. Then inspect the selected album and show its square/tall availability and resolutions.

Treat square + best as the recommended default intent. When the user supplied only artist and album names, use the question tool once to ask whether they want **“Square, best quality (recommended)”** and whether they need another resolution; explain that they can instead choose an inspected square size or tall. Skip this question and use square + best when the user explicitly says “download directly,” “default,” “highest,” or “best.” If the user chooses tall, ask for one of its actual sizes or best.

Download with both choices explicit. Use an exact `WxH` for a selected size, and never silently fall back:

```bash
node scripts/apple-music-artwork.mjs download 1665303755 --variant square --resolution best
node scripts/apple-music-artwork.mjs download 1665303755 --variant tall --resolution 1080x1440 --output artwork.mp4
```

Omit `--output` to save the predictable default filename in the current working directory. After downloading, report the path and, when `ffprobe` is available, verify one video stream, expected width and height, and duration greater than zero:

```bash
ffprobe -v error -select_streams v -show_entries stream=codec_name,width,height -show_entries format=duration -of json "<output.mp4>"
```

Use `--experimental-web-token` on any command only when no developer token is available and the user explicitly requests the experimental path. Do not bypass DRM or encryption; report an `ffmpeg` failure instead.

## Respect API boundaries

Treat Catalog search and album lookup as official APIs. Treat `extend=editorialVideo`, `motionDetailSquare`, and `motionDetailTall` as undocumented Web extensions that may change or disappear. Read [references/api-and-auth.md](references/api-and-auth.md) before explaining authentication, API status, source attribution, or compliance boundaries.
