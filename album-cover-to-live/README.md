# Album Cover to Live

[简体中文](README.zh-CN.md) · [Agent Instructions](SKILL.md) · [Skill Index](../README.md)

Resolves album artwork via MusicBrainz / Cover Art Archive (opt-in Deezer fallback), plans conservative motion briefs, and generates silent looping live covers with MiniMax H3 after explicit confirmation.

## Installation

```bash
# Install into AI agent (add -g for global)
npx skills add miantiao-me/skills --skill album-cover-to-live
```

Installed agents load [`SKILL.md`](SKILL.md) to guide resolution, motion planning, dry-run validation, paid confirmation, and review.

## Requirements and Environment

- **Node.js 20+**, with `ffmpeg` and `ffprobe` on `PATH`.
- Zero npm dependencies; no `npm install` required.
- Run all CLI commands directly from this `album-cover-to-live` directory.
- `MUSICBRAINZ_CONTACT`: Environment variable or `--contact <email-or-url>` required for metadata requests.
- `MINIMAX_API_KEY`: Required only for confirmed paid execution (not needed for lookup or dry-run).

## Quick Start (CLI)

```bash
# 1. Resolve and download cover art
node scripts/album-cover-to-live.mjs resolve --artist "<ARTIST>" --album "<ALBUM>" --contact "<EMAIL_OR_URL>" --output-dir ./output --json

# 2. Plan motion prompt against the downloaded cover
node scripts/album-cover-to-live.mjs plan --input ./output/cover.jpg --brief ./brief.json --output ./output/prompt.txt --json
```

Adjust `--input` in step 2 to match the actual file extension saved by resolve; draft `--brief` by visually inspecting the artwork according to the [CLI Reference](./references/cli-reference.md).

For full workflows including `--dry-run`, paid generation, review commands, and flags, see the [CLI Reference](./references/cli-reference.md).

## Operational Boundaries

- **Dry-run Behavior**: `--dry-run` re-validates metadata and downloads cover art online, but does not call remote MiniMax H3 models.
- **Paid Generation Safeguards**: Requires user confirmation of the target cover, full prompt, generation parameters, and upload intent before calling paid APIs. Paid runs require `--confirm-paid-generation` and `--expected-cover-sha256 <64hex>` matching the image hash. Never retry paid generation blindly.
- **Tasks and Timeouts**: Remote timeouts do not cancel generation in progress. Check atomic receipts (`task-<type>-<id>.json`) by task ID rather than resubmitting.
- **Motion Briefs**: Operators visually inspect artwork to draft `--brief` JSON. Defaults to a low-amplitude fallback marked `needs_review` if omitted; visual inspection is still required. See [Motion Design Guide](./references/motion-design-guide.md).
- **Review**: Technical checks (`review` contact sheet and metrics) verify format compliance, not visual fidelity or loop quality.
- **Rights**: Tooling is licensed under the root [MIT License](../LICENSE). Cover art and generated video usage require appropriate rights from respective holders. See [Providers and Rights](./references/providers-and-rights.md).
