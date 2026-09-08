# API, authentication, and compliance boundaries

## Supported boundary

- Use Apple Music Catalog search and album lookup as documented API operations.
- Authenticate documented requests with a user-supplied `APPLE_MUSIC_DEVELOPER_TOKEN` and `https://api.music.apple.com`.
- Regard `extend=editorialVideo`, `platform=web`, `motionDetailSquare`, and `motionDetailTall` as undocumented, best-effort Apple Music Web behavior. Their presence and response shape can change without notice.
- Regard rendition resolutions and stream metadata as values discovered from undocumented HLS media manifests. Parsing and deterministic `best` or exact-resolution selection are CLI behaviors, not Apple API guarantees.
- Use `--experimental-web-token` only after explicit user approval. It discovers a bearer token from public `music.apple.com` JavaScript assets at runtime and sends requests to `https://amp-api.music.apple.com`. This is not an official authentication method.
- Never store, cache, embed, or print developer or Web bearer tokens.
- Download only unencrypted HLS media the user is entitled to access. Do not circumvent DRM, encryption, access controls, or regional restrictions.
- Invoke the user's local FFmpeg executable. Surface failures rather than attempting circumvention.

## Sources

- Apple, [Generating Developer Tokens](https://developer.apple.com/documentation/applemusicapi/generating-developer-tokens)
- Apple, [Search for Catalog Resources](https://developer.apple.com/documentation/applemusicapi/search-for-catalog-resources-(by-type))
- Apple, [Get a Catalog Album](https://developer.apple.com/documentation/applemusicapi/get-a-catalog-album)
- Apple, [Handling Resource Representation and Relationships](https://developer.apple.com/documentation/applemusicapi/handling-resource-representation-and-relationships)
- Apple, [HTTP Live Streaming](https://developer.apple.com/streaming/)
- FFmpeg, [ffmpeg Documentation](https://ffmpeg.org/ffmpeg.html)

No Apple or third-party token is bundled.
