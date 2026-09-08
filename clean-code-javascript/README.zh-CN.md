# Clean Code JavaScript

[English](./README.md) · [Skill 索引](../README.zh-CN.md)

这个 Skill 用来审查和逐步改进现代 JavaScript 与 TypeScript。内容覆盖正确性、类型安全、代码可读性、模块设计、副作用、异步任务、错误处理和测试，但不会假设所有项目都适合同一种写法。

## 何时使用

它适合代码审查、可维护性改进、保持行为不变的重构，以及范围明确的现代化整理。这些原则是需要结合上下文判断的参考，不是打分表；运行环境、公共 API、项目惯例和现有行为比口号更重要。

需要落地修改时，先选择能解决具体问题的最小改动；只做审查时，也可以用同一套资料说明问题，而不必把建议扩大成重写。

## 内容导航

详细内容分成五份参考资料。按当前任务选择即可；只有全面审查时才需要全部阅读。

- [Core JavaScript](./references/core-javascript.md)：命名、函数、所有权、可变性、副作用和运行时约束。
- [TypeScript](./references/typescript.md)：严格性、运行时验证、类型收窄、状态建模、公共类型和局部类型逃生口。
- [Design and Modules](./references/design-and-modules.md)：对象、封装、组合、类、SOLID、依赖、模块和复用。
- [Async and Errors](./references/async-and-errors.md)：Promise、并发、取消、异步迭代和错误模型。
- [Testing and Refactoring](./references/testing-and-refactoring.md)：行为测试、注释、自动化、死代码和渐进验证。

[`SKILL.md`](./SKILL.md) 记录了具体工作方式，以及各份参考资料的使用时机。

## 来源、改编与许可

这是 Ryan McDermott 的 [clean-code-javascript](https://github.com/ryanmcdermott/clean-code-javascript) 的现代化独立改编，不是 Ryan McDermott 或上游维护者发布的官方 Skill。原有理念结合当代 JavaScript 与 TypeScript 做了更新，并整理成上面的五份参考资料。这里没有复制完整的上游 README，原文仍可从来源链接查看。

上游项目采用 MIT License，相关版权和许可声明保留在当前目录的 [LICENSE](./LICENSE) 中。本仓库新增内容采用根目录的 [MIT License](../LICENSE)，第三方材料继续适用原许可证。
