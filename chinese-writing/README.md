# Chinese Writing

[简体中文](./README.zh-CN.md) · [Skill Index](../README.md)

Writing and copyediting guidelines for crafting clean, restrained, modern Simplified Chinese. Designed for tech blogs, newsletters, independent hacker memos, and developer documentation, with strict AI de-slopping principles and a rigorous copyediting workflow.

## Installation

```bash
# Install into AI agent (add -g for global)
npx skills add miantiao-me/skills --skill chinese-writing
```

This skill is a pure reference guide with **no CLI executables or runtime scripts**. Once installed, AI agents load [`SKILL.md`](./SKILL.md) to draft authentic Chinese content or act as an uncompromising copyeditor. Zero runtime dependencies.

## Key Principles

- **Clarity and Action**: Let pure verbs drive the sentence; avoid nominalization (burying verbs in abstract nouns).
- **Old-to-New Flow**: Lead with familiar concepts and place emphasized conclusions at the stress position (end of sentence).
- **AI De-slopping**: Eliminate 24 common AI writing anti-patterns, filler buzzwords, and fake tripartite lists.
- **Copyediting Discipline**: Treat the LLM as a ruthless copyeditor rather than a bland ghostwriter. Never adopt machine headline clichés; forbid flattering encouragement.
- **Grounded Voice**: Value concrete data, genuine trade-offs, and hacker restraint over corporate PR hype.

## Reference Guide

The complete reference manual is unified in:

- [Writing and Copyediting Guide](./references/guide.md): Syntax rules, 24 AI anti-patterns, warning word alternatives, 4-pass copyediting workflow, and genre examples (newsletters, memos, blog posts).

## License and References

This skill is distributed under the [MIT License](./LICENSE).

### References

- [Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/)
- [op7418/humanizer-zh](https://github.com/op7418/humanizer-zh)
- [Thomas Ptacek: How To Write With An LLM](https://sockpuppet.org/blog/2026/09/17/how-to-write-with-an-llm/)
- Joseph M. Williams & Joseph Bizup: *Style: Lessons in Clarity and Grace*
