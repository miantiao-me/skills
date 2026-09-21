---
name: chinese-writing
description: 指导创作与审校清晰、克制、无 AI 味的现代简体中文。适用于技术博客、周刊资讯、独立开发随笔与产品文档的起草与挑刺式审校。
---

# 中文写作指南

指导大模型撰写与审校清晰、克制、无机器味的现代简体中文。拒绝公关腔、翻译腔与套话。

## 核心心法

- **清晰（Clarity）**：角色明确，动作直接。让纯粹动词承担核心动作，消灭动词名词化。
- **克制（Restraint）**：事实先行，克制修辞。不使用夸大象征意义的形容词与空洞口号。
- **真实（Human）**：像人一样说话，长短句交错，提供具体细节、观点与态度，允许可控的个人视角。
- **精炼（Concision）**：剔除不承载信息的过渡词、元话语与碎屑填充词，直奔主题。

## 执行工作流

执行任务前先明确任务模式：

### 模式 A：起草（Drafting）

1. **厘清意图**：明确目标受众、事实信源与核心诉求。
2. **倒金字塔**：结论与核心事实置顶，技术细节与数据次之，背景与展开收尾。
3. **动作落地**：主动语态优先，主谓明确（「团队发布了新功能」优于「新功能被团队所发布」）。
4. **旧到新承接**：句首承接已知概念，句尾放置关键推论或新概念。
5. **排版克制**：中英文之间保留一个半角空格（盘古之白），使用全角标点，严禁装饰性 Emoji 与滥用粗体。

### 模式 B：审校（Copyediting）

做严苛挑刺的审校员（Copyeditor），不做磨平特色的代笔（Ghostwriter）。恪守两大铁律：

1. **铁律一：绝不套用模型金句**。不把文章改成四平八稳的杂志大标题或人造芝士（Velveeta），保留作者原本的声音与呼吸感。
2. **铁律二：拒绝廉价称赞与谄媚夸奖（Avoid Encouragement）**。直击逻辑断层、表达臃肿与多余段落。
3. **四步机械扫描**：
   - **结构层**：裁撤废话，检查是否有 15%–30% 的段落可以删除或移位。
   - **句法层**：还原被名词化的动词（如「进行……的探讨」改为「探讨」），消灭无谓被动句与系动词回避。
   - **词汇层**：清扫「此外」、「至关重要」、「值得注意的是」等高频 AI 词与碎屑填充词。
   - **节奏层**：打断连续三句等长或对称排比的机械结构，制造长短句交错的呼吸感。

## 参考指南

详细规则、AI 反模式识别、警示词平替表、审校执行流与文体范例集中收录于 [`references/guide.md`](references/guide.md)。在以下场景查阅：

- 逐项排查 24 种 AI 写作反模式与高频警示词平替；
- 执行四步机械审校与深入挑刺；
- 撰写周刊资讯条目、极客随笔（Memo）或技术产品发布文。

## 参考来源

- miantiao-me/aigc-weekly: chinese-writing (https://github.com/miantiao-me/aigc-weekly)
- Microsoft Writing Style Guide (https://learn.microsoft.com/en-us/style-guide/)
- op7418/humanizer-zh (https://github.com/op7418/humanizer-zh)
- Thomas Ptacek: How To Write With An LLM (https://sockpuppet.org/blog/2026/09/17/how-to-write-with-an-llm/)
- Joseph M. Williams & Joseph Bizup: Style: Lessons in Clarity and Grace
- 面条实验室 / memo.miantiao.me 写作实践
