# 面条的技能库

[English](./README.md)

这里收录了一组面向具体开发任务的 AI Skills。每个目录都包含 Skill 说明，以及完成任务所需的参考资料或工具。

## Skill 清单

| Skill | 能做什么 | 来源与许可 |
| --- | --- | --- |
| [apple-music-animated-artwork](./apple-music-animated-artwork/README.zh-CN.md) | 查找 Apple Music 专辑，并将可用的正方形或竖版动态封面下载为 MP4。 | 使用 Apple Catalog API 和未文档化的 Web 行为；媒体权利仍归原权利人。 |
| [clean-code-javascript](./clean-code-javascript/README.zh-CN.md) | 帮助审查和改进现代 JavaScript 与 TypeScript，避免把局部整理变成大规模重写。 | Ryan McDermott 的 MIT 许可项目 [clean-code-javascript](https://github.com/ryanmcdermott/clean-code-javascript) 的独立非官方改编。 |

## 目录结构

```text
skills/
├── LICENSE
├── README.md
├── README.zh-CN.md
└── <skill-name>/
    ├── SKILL.md
    ├── README.md
    ├── README.zh-CN.md
    ├── LICENSE             # 来源或许可证要求时保留
    ├── references/         # 按主题拆分的详细说明
    └── scripts/            # 可选的配套工具
```

## 贡献

- 每个 Skill 包含一份简洁的 `SKILL.md`，并提供彼此互链的中英文 README。
- YAML frontmatter 只放 `name` 和 `description`；较长的说明移到 `references/`。
- 只保留实际使用的文件，同时保留必要的来源、归属和许可信息。
- 新增或重命名 Skill 时，同步更新两份根索引，并检查双语结构和相对链接。

## 许可证

仓库原创内容采用 [MIT License](./LICENSE)。第三方代码、内容和媒体仍受各自许可证与权利约束。
