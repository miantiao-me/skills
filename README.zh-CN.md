# 面条的技能库

[English](./README.md)

本仓库是一个可持续增加多个可复用 AI Skills 的集合。每个 Skill 聚焦一项明确任务，并将执行说明与按需加载的参考资料放在独立目录中，以便维护和扩展。

## Skill 清单

| Skill | 用途 | 来源与许可 |
| --- | --- | --- |
| [clean-code-javascript](./clean-code-javascript/SKILL.md) | 用于现代 JavaScript/TypeScript clean-code review 与 incremental refactoring | 基于 Ryan McDermott 的 [clean-code-javascript](https://github.com/ryanmcdermott/clean-code-javascript) 独立改编；原作采用 MIT License |

`clean-code-javascript` 是独立改编作品，不是 Ryan McDermott 或上游维护者发布的官方 Skill。相关原则已现代化整理进五篇主题参考文档；本仓库不捆绑完整上游 README，可通过来源链接访问；上游来源归属和上游许可证均予以保留。

## 目录约定

```text
skills/
├── LICENSE
├── README.md
├── README.zh-CN.md
└── <skill-name>/
    ├── SKILL.md
    ├── LICENSE             # 按来源或许可证要求提供
    └── references/         # 按需加载的规范或资料
```

- 每个 Skill 必须包含 `SKILL.md`。
- `SKILL.md` 的 YAML frontmatter 仅使用 `name` 和 `description`。
- 仅保留 Skill 实际需要的脚本、参考资料和资源，不保留示例占位内容。
- 保留第三方许可证要求的版权与许可声明。
- 只有在许可证允许且确有追溯需要时才归档第三方原文，并清楚标明改编关系。

## 添加新 Skill

1. 使用标准初始化工具创建 `<skill-name>/` 目录。
2. 保持 `SKILL.md` 精炼；将详细资料放入 `references/`，并说明读取时机。
3. 删除生成的示例和没有实际用途的目录。
4. 使用第三方内容时，保留其许可证要求的所有版权与许可声明。只有在许可证允许且确有追溯需要时才归档原文，并清楚标明改编关系和来源 URL。
5. 将新 Skill 加入上方清单，并使用项目现有检查方式验证其结构。

## 许可证

本项目的代码和内容按仓库根目录的 [MIT License](./LICENSE) 发布。第三方内容仍受各自许可证约束。
