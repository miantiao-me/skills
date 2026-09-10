# 面条的技能库

[English](./README.md)

收录面向实际工程场景的 AI Skills 与开发者工具。每个技能均存放在独立目录中，内含操作指引、参考规范及配套脚本（如有）。

## 技能清单

| 技能 | 用途 |
| --- | --- |
| [album-cover-to-live](./album-cover-to-live/README.zh-CN.md) | 检索专辑封面、规划运动 Brief，确认后通过 MiniMax H3 生成静音视频。 |
| [apple-music-animated-artwork](./apple-music-animated-artwork/README.zh-CN.md) | 检索 Apple Music 专辑并下载官方动态封面为 MP4 视频。 |
| [clean-code-javascript](./clean-code-javascript/README.zh-CN.md) | 现代 JavaScript 与 TypeScript 的代码审查准则与可维护性重构参考。 |

## 技能安装

使用 `npx skills` 将技能安装到 AI Agent：

```bash
# 交互式选择安装
npx skills add miantiao-me/skills

# 安装全部技能
npx skills add miantiao-me/skills --skill '*'
```

添加 `-g`（或 `--global`）可全局安装到用户级 Agent 配置，默认仅安装到当前项目。各技能的单技能安装命令与运行前置依赖（如 Node.js 或 `ffmpeg`）详见对应技能目录。

## 使用方式

- **配合 AI Agent**：安装后在对话中直接描述任务或提及技能名称。
- **终端直接运行**：工具类技能需进入对应技能子目录下运行。`clean-code-javascript` 为工程参考规范，无 CLI 可执行脚本。

## 许可证

本仓库原创代码与文档采用 [MIT 许可证](./LICENSE)。`clean-code-javascript` 改编自 Ryan McDermott 的 MIT 开源项目 [clean-code-javascript](https://github.com/ryanmcdermott/clean-code-javascript)（保留其原 [LICENSE](./clean-code-javascript/LICENSE)）。
