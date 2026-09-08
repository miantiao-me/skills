# Clean Code JavaScript

[简体中文](./README.zh-CN.md) · [Skill index](../README.md)

This Skill helps review and gradually improve modern JavaScript and TypeScript. It covers correctness, type safety, readable code, module design, side effects, async work, error handling, and tests without assuming that every codebase needs the same solution.

## When to Use

It is useful for code reviews, maintainability work, behavior-preserving refactors, and focused modernization. The guidance is a set of context-sensitive heuristics, not a scorecard: runtime support, public APIs, existing conventions, and current behavior take priority over stylistic slogans.

For an implementation task, start with the smallest change that solves the concrete problem. For a review, use the same material to explain findings without requiring a rewrite.

## Content Guide

The detailed guidance is split into five references. Open the ones that match the work at hand; use all five for a broad review.

- [Core JavaScript](./references/core-javascript.md): naming, functions, ownership, mutation, side effects, and runtime constraints.
- [TypeScript](./references/typescript.md): strictness, runtime validation, narrowing, state models, public types, and narrow escape hatches.
- [Design and Modules](./references/design-and-modules.md): objects, encapsulation, composition, classes, SOLID, dependencies, modules, and reuse.
- [Async and Errors](./references/async-and-errors.md): promises, concurrency, cancellation, asynchronous iteration, and error models.
- [Testing and Refactoring](./references/testing-and-refactoring.md): behavioral tests, comments, automation, dead code, and incremental validation.

[`SKILL.md`](./SKILL.md) contains the working instructions and explains when to use each reference.

## Source, Adaptation, and License

This is an independent modern adaptation of Ryan McDermott's [clean-code-javascript](https://github.com/ryanmcdermott/clean-code-javascript), not an official Skill from Ryan McDermott or its upstream maintainers. The original ideas have been updated for current JavaScript and TypeScript and reorganized into the five references above. The complete upstream README is not copied here; it remains available from the source link.

The upstream project uses the MIT License, and its copyright and license notice are preserved in this directory's [LICENSE](./LICENSE). New material from this repository is covered by the root [MIT License](../LICENSE). Third-party material keeps its original license.
