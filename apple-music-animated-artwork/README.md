# Apple Music Animated Artwork

[简体中文](./README.zh-CN.md) · [Skill index](../README.md)

This Skill comes with a small, dependency-free CLI for finding Apple Music albums and saving available animated artwork as MP4. It can inspect both square and tall artwork before downloading, so you can see which sizes an album offers.

## Before you start

- Node.js 20 or later
- FFmpeg available as `ffmpeg`
- An Apple Music developer token for the official Catalog API

Run the commands from this Skill directory. Put your developer token in the environment rather than in a file or command output:

```bash
export APPLE_MUSIC_DEVELOPER_TOKEN='<developer-token>'
```

This is the recommended authentication method. If no developer token is available, the CLI also has `--experimental-web-token`. It discovers a public Apple Web bearer token at runtime and sends requests through the Apple Music Web client host. This route is unofficial and may stop working, so use it only after the person requesting the download has explicitly agreed.

## Quick start

Search with the artist and album name, then inspect the matching album:

```bash
node scripts/apple-music-artwork.mjs search "Pink Floyd The Dark Side of the Moon 50th Anniversary" --storefront us --limit 5 --json
node scripts/apple-music-artwork.mjs inspect 1665303755 --storefront us
```

The search can return several albums. Check both the artist and album name, and ask for a choice if the result is ambiguous rather than guessing. `inspect` shows whether square and tall artwork are available and lists the advertised resolutions.

Both `inspect` and `download` accept either an album ID or an Apple Music album URL. For all available options, run:

```bash
node scripts/apple-music-artwork.mjs help
```

## Download and verify

Square artwork at the best available quality is the usual default. The download command always names the variant; it can choose `best` or an exact `WxH` resolution:

```bash
node scripts/apple-music-artwork.mjs download 1665303755 --variant square --resolution best
node scripts/apple-music-artwork.mjs download 1665303755 --variant tall --resolution 1080x1440 --output artwork.mp4
```

An exact resolution never falls back to another size. The CLI uses local FFmpeg to create the MP4. Without `--output`, it creates a predictable filename in the current directory. It will not replace an existing file unless you add `--force`, and it prints the saved path when finished.

If `ffprobe` is installed, this command lets you confirm that the file has a video stream, the expected dimensions, and a duration greater than zero:

```bash
ffprobe -v error -select_streams v -show_entries stream=codec_name,width,height -show_entries format=duration -of json "<output.mp4>"
```

## Limits and copyright

Album search and lookup use Apple's documented Catalog API. Animated artwork relies on the undocumented Web fields `extend=editorialVideo`, `platform=web`, `motionDetailSquare`, and `motionDetailTall`. These fields can change or disappear without notice. Available sizes are read from HLS manifests rather than guaranteed by the Apple API.

Downloads are limited to accessible, unencrypted HLS streams. The tool does not bypass DRM, encryption, access controls, or regional restrictions. If a stream is unavailable, encrypted, unsupported, or FFmpeg fails, the download stops with an error.

The repository contains no Apple or third-party token. The full source list and API boundaries are documented in [API, authentication, and compliance boundaries](./references/api-and-auth.md).

Code and original documentation in this repository are covered by the root [MIT License](../LICENSE). Downloaded artwork belongs to its respective rights holders. The repository license does not cover that media or grant permission to redistribute it.
