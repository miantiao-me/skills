# MT's Skill Library

[简体中文](./README.zh-CN.md)

Reusable AI Skills and developer tools for real-world engineering workflows. Each skill lives in a self-contained directory with instructions, reference guides, and supporting tools when applicable.

## Skills

| Skill | Description |
| --- | --- |
| [album-cover-to-live](./album-cover-to-live/README.md) | Resolves album art, plans motion briefs, and generates silent video via MiniMax H3 after explicit confirmation. |
| [apple-music-animated-artwork](./apple-music-animated-artwork/README.md) | Searches Apple Music albums and downloads official animated artwork as MP4 video. |
| [chinese-writing](./chinese-writing/README.md) | Writing and copyediting guidelines for crafting clean, restrained, modern Simplified Chinese. |
| [clean-code-javascript](./clean-code-javascript/README.md) | Code review heuristics and maintainability guide for modern JavaScript and TypeScript. |

## Installation

Install skills into your AI agent using `npx skills`:

```bash
# Interactive selection
npx skills add miantiao-me/skills

# Install all skills
npx skills add miantiao-me/skills --skill '*'
```

Add `-g` (or `--global`) to install globally to user-level agent configs instead of the current project. Single-skill installation commands and runtime prerequisites (such as Node.js or `ffmpeg`) are documented in each skill's directory.

## Usage

- **AI Agents**: Once installed, invoke skills by name or describe your task in conversation.
- **Direct Terminal**: For tool-based skills (`album-cover-to-live`, `apple-music-animated-artwork`), run commands directly from the skill's directory. `chinese-writing` and `clean-code-javascript` are reference guides without CLI executables.

## License

Original code and documentation in this repository are available under the [MIT License](./LICENSE). `clean-code-javascript` is adapted from Ryan McDermott's MIT-licensed [clean-code-javascript](https://github.com/ryanmcdermott/clean-code-javascript) (see [LICENSE](./clean-code-javascript/LICENSE)). `chinese-writing` is distributed under the MIT License (see [LICENSE](./chinese-writing/LICENSE)).
