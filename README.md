# MT's Skill Library

[简体中文](./README.zh-CN.md)

Reusable AI Skills for focused development tasks. Each directory contains the Skill instructions and any references or tools it needs.

## Skills

| Skill | What it does | Source and license |
| --- | --- | --- |
| [apple-music-animated-artwork](./apple-music-animated-artwork/README.md) | Finds Apple Music albums and downloads available square or tall animated artwork as MP4. | Uses Apple's Catalog API and undocumented Web behavior; media rights remain with their owners. |
| [clean-code-javascript](./clean-code-javascript/README.md) | Helps review and improve modern JavaScript and TypeScript without turning a focused cleanup into a rewrite. | An independent, unofficial adaptation of Ryan McDermott's MIT-licensed [clean-code-javascript](https://github.com/ryanmcdermott/clean-code-javascript). |

## Repository layout

```text
skills/
├── LICENSE
├── README.md
├── README.zh-CN.md
└── <skill-name>/
    ├── SKILL.md
    ├── README.md
    ├── README.zh-CN.md
    ├── LICENSE             # Included when a source or license requires it
    ├── references/         # Longer topic guides
    └── scripts/            # Optional supporting tools
```

## Contributing

- Give every Skill a concise `SKILL.md` and linked English and Chinese READMEs.
- Keep YAML frontmatter to `name` and `description`; move longer guidance into `references/`.
- Include only files the Skill uses. Keep required attribution, source links, and license notices.
- Add or rename a Skill in both root indexes, then check the bilingual structure and relative links.

## License

Original material in this repository is available under the [MIT License](./LICENSE). Third-party code, content, and media keep their own licenses and rights.
