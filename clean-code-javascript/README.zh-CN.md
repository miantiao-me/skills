# Clean Code JavaScript

[English](./README.md) · [Skill 索引](../README.zh-CN.md)

现代 JavaScript 与 TypeScript 的工程实践指南与代码审查准则，强调代码可读性、类型安全性与保持行为不变的渐进重构。

## 技能安装

```bash
# 安装到 AI Agent（追加 -g 为全局安装）
npx skills add miantiao-me/skills --skill clean-code-javascript
```

本技能为工程参考规范，**无 CLI 可执行脚本**。安装后由 Agent 读取 [`SKILL.md`](./SKILL.md) 在审查与重构时按需查阅对应主题指南。开发者亦可直接查阅。零运行依赖，无需执行 `npm install`。

## 主题参考指南

按当前任务查阅对应模块：

- [核心 JavaScript 实践](./references/core-javascript.md)：命名、函数职责、参数设计、对象可变性与副作用隔离。
- [TypeScript 类型设计](./references/typescript.md)：严格模式、类型收窄、状态建模与局部逃生口约束。
- [面向对象与模块设计](./references/design-and-modules.md)：封装、组合优先、SOLID 原则应用与模块解耦。
- [异步编程与错误处理](./references/async-and-errors.md)：Promise 规范、并发控制、异步取消与结构化异常。
- [测试策略与重构边界](./references/testing-and-refactoring.md)：行为测试、注释取舍、死代码清理与小步安全重构。

## 来源与许可

改编自 Ryan McDermott 的 MIT 开源项目 [clean-code-javascript](https://github.com/ryanmcdermott/clean-code-javascript)，针对现代 JS/TS 做了更新。完整保留原 [LICENSE](./LICENSE)。本仓库新增内容采用根目录 [MIT 许可证](../LICENSE)。
