# Repository Instructions

## Repository shape

- This is a Markdown-only collection of reusable AI Skills, not an application or package.
- Each top-level Skill directory is self-contained: `SKILL.md` is required; `references/`, scripts, assets, and a Skill-specific `LICENSE` exist only when needed.

## Editing Skills

- Limit `SKILL.md` YAML frontmatter to `name` and `description`.
- Keep `SKILL.md` concise. Put detailed material in `references/` and state when an agent should read each reference.
- Remove generated examples, placeholder directories, and resources the Skill does not use.
- When adding or renaming a Skill, update the Skill lists and matching descriptions in both `README.md` and `README.zh-CN.md`.
- Preserve copyright and license notices required by third-party licenses. Keep source URLs and clearly state adaptation relationships; do not replace a Skill-specific license with the root license.

## Validation

- No package manager, build, test, lint, formatter, typecheck, codegen, or CI command is configured. Do not invent commands for them.
- Manually verify changed YAML frontmatter, relative links, bilingual README alignment, attribution, and that no unused files were added.
- Report that automated checks are unavailable rather than implying they passed.
