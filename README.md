# MT's Skill Library

[简体中文](./README.zh-CN.md)

This repository is a collection designed to grow sustainably with multiple reusable AI Skills. Each Skill focuses on a defined task and keeps its instructions and on-demand references in a self-contained directory for straightforward maintenance and expansion.

## Skills

| Skill | Purpose | Source and license |
| --- | --- | --- |
| [clean-code-javascript](./clean-code-javascript/SKILL.md) | Modern JavaScript/TypeScript clean-code review and incremental refactoring | Independently adapted from Ryan McDermott's [clean-code-javascript](https://github.com/ryanmcdermott/clean-code-javascript), originally released under the MIT License |

`clean-code-javascript` is an independent adaptation, not an official Skill from Ryan McDermott or the upstream maintainers. Relevant principles have been modernized and organized into five topical reference documents. The complete upstream README is not bundled and remains available through the source link; upstream attribution and the upstream license are retained.

## Directory Conventions

```text
skills/
├── LICENSE
├── README.md
├── README.zh-CN.md
└── <skill-name>/
    ├── SKILL.md
    ├── LICENSE             # Included when required by its source or license
    └── references/         # Specifications or resources loaded on demand
```

- Every Skill must include `SKILL.md`.
- The YAML frontmatter in `SKILL.md` uses only `name` and `description`.
- Keep only scripts, references, and assets that the Skill actually needs; do not retain placeholder examples.
- Keep copyright and license notices required by third-party licenses.
- Archive original third-party text only when its license permits it and a genuine traceability need exists, and clearly identify the adaptation relationship.

## Adding a New Skill

1. Create a `<skill-name>/` directory using the standard initialization tooling.
2. Keep `SKILL.md` concise; place detailed material in `references/` and state when it should be read.
3. Remove generated examples and directories that have no practical use.
4. For third-party content, retain all copyright and license notices required by its license. Archive original text only when the license permits it and traceability genuinely requires it, and clearly mark the adaptation and source URL.
5. Add the Skill to the list above and validate its structure using the project's existing checks.

## License

The project's code and content are released under the [MIT License](./LICENSE) in the root of this repository. Third-party content remains subject to its respective licenses.
