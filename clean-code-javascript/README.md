# Clean Code JavaScript

[简体中文](./README.zh-CN.md) · [Skill Index](../README.md)

Engineering guide and code review heuristics for modern JavaScript and TypeScript, emphasizing readable code, type safety, and behavior-preserving refactoring over rigid slogans.

## Installation

```bash
# Install into AI agent (add -g for global)
npx skills add miantiao-me/skills --skill clean-code-javascript
```

This skill is a reference guide with **no CLI executables or scripts**. Once installed, AI agents load [`SKILL.md`](./SKILL.md) and reference topic guides during code review and refactoring. Developers can also read the guides directly. Zero runtime dependencies; no `npm install` needed.

## Topic Guides

Read the guide relevant to your task:

- [Core JavaScript](./references/core-javascript.md): Naming, functions, immutability, side-effect isolation.
- [TypeScript Design](./references/typescript.md): Strictness, type narrowing, state modeling, safe escape hatches.
- [Design and Modules](./references/design-and-modules.md): Encapsulation, composition over inheritance, SOLID, modules.
- [Async and Errors](./references/async-and-errors.md): Promises, concurrency, cancellation, error models.
- [Testing and Refactoring](./references/testing-and-refactoring.md): Behavioral testing, purposeful comments, incremental validation.

## Source and License

An independent adaptation of Ryan McDermott's MIT-licensed [clean-code-javascript](https://github.com/ryanmcdermott/clean-code-javascript), updated for modern JS/TS. Preserves the original [LICENSE](./LICENSE). New content is covered by the root [MIT License](../LICENSE).
