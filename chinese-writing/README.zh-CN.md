# 中文写作指南 (Chinese Writing)

[English](./README.md) · [Skill 索引](../README.zh-CN.md)

现代简体中文写作与审校指引，用于技术博客、周刊资讯、极客随笔（Memo）与开发者文档的起草与润色。结合去 AI 味规范、清晰优雅的句法原理与严格的审校工作流，拒绝公关腔、翻译腔与套话。

## 技能安装

```bash
# 安装到 AI Agent（追加 -g 为全局安装）
npx skills add miantiao-me/skills --skill chinese-writing
```

本技能为纯参考指引，**无 CLI 可执行脚本与运行时依赖**。安装后由 AI Agent 读取 [`SKILL.md`](./SKILL.md)，用于起草中文或按严苛审校标准挑刺润色；开发者亦可直接查阅。

## 核心原则

- **动作与角色**：以纯粹动词驱动，杜绝动词名词化（如「进行……的分析」）；主谓关系明确，主动语态优先。
- **信息流与凝聚力**：旧信息在前承接已知，核心重心置于句尾（尾重音原则）。
- **去 AI 痕迹**：识别并清除 24 种 AI 写作反模式、高频警示词与机械排比。
- **严苛审校纪律**：把 LLM 当做挑刺编辑而非磨灭个性的代笔。不照抄模型金句，拒绝廉价称赞，执行四步机械扫描。
- **真实极客之声**：实测数据先行，边界与取舍清晰，保持克制与真实的人类声音。

## 参考指南

全部参考内容合并在统一文档中：

- [中文写作与审校参考指南](./references/guide.md)：句法规范、24 种 AI 反模式、警示词平替表、四步审校操作流与典型文体范例（周刊、随笔、长文）。

## 许可证与参考来源

本技能采用 [MIT 许可证](./LICENSE)。

### 参考来源

- [Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/)
- [op7418/humanizer-zh](https://github.com/op7418/humanizer-zh)
- [Thomas Ptacek: How To Write With An LLM](https://sockpuppet.org/blog/2026/09/17/how-to-write-with-an-llm/)
- Joseph M. Williams & Joseph Bizup: Style: Lessons in Clarity and Grace
