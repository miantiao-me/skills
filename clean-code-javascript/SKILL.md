---
name: clean-code-javascript
description: Review and refactor modern JavaScript and TypeScript for correctness, type safety, clarity, focused responsibilities, controlled side effects, robust async/error handling, and useful reuse. Use for clean-code reviews, maintainability improvements, incremental refactors, or modernization of existing JS/TS code while preserving behavior and project constraints.
---

# Clean Code JavaScript

## Use the references

Read only the references relevant to the task; do not load the full set by default. For a broad codebase audit, read all five.

- [`references/core-javascript.md`](references/core-javascript.md): runtime constraints, names, declarations, functions, ownership, mutation, and side effects.
- [`references/typescript.md`](references/typescript.md): strictness, runtime validation, narrowing, state modeling, public types, and contained unsafe escapes.
- [`references/design-and-modules.md`](references/design-and-modules.md): objects, encapsulation, composition, classes, pragmatic SOLID, dependencies, modules, and reuse.
- [`references/async-and-errors.md`](references/async-and-errors.md): promises, concurrency, cancellation, asynchronous iteration, and error models.
- [`references/testing-and-refactoring.md`](references/testing-and-refactoring.md): behavioral tests, comments, automation, dead code, incremental validation, and non-mechanical application.

Apply every reference with the target runtime, compiler, framework, public API, and repository conventions in mind.

## Follow the workflow

1. Determine the request mode before acting. For review-only requests, do not modify files; report findings by severity with file and line evidence, and run only useful, non-mutating validation.
2. Inspect the supported runtime, `package.json`, module system, `tsconfig`, lint and format configuration, test setup, public API constraints, and repository instructions.
3. Establish current behavior from tests, types, call sites, and observable inputs and outputs before changing code.
4. Review in this order:
   - Check correctness and type safety.
   - Improve names, data modeling, and control-flow clarity.
   - Separate responsibilities only where the existing code mixes reasons to change.
   - Contain side effects and verify async and error semantics.
   - Remove harmful duplication only after the repeated concept is stable.
5. Choose the smallest refactor that addresses the concrete problem.
6. Preserve behavior and compatibility unless the user explicitly requests a behavior or platform change.
7. Match existing local patterns when several clean designs are equally valid.
8. Run the project's existing type checks, linting, formatting checks, tests, and build commands that cover the change.
9. Report skipped or unavailable validation and any remaining behavioral risk.

## Avoid mechanical rules

- Use clean-code principles as context-sensitive heuristics, not scorecard rules.
- Avoid rewrites that only satisfy a slogan, reduce line count, or introduce unsupported syntax.
- Prefer evidence from behavior, types, project constraints, and maintenance costs.
- Keep justified exceptions when they make a boundary safer or the code clearer.

## Attribute the source

- This Skill is an independent modern adaptation based on Ryan McDermott's `clean-code-javascript`: https://github.com/ryanmcdermott/clean-code-javascript.
- The original work is licensed under the MIT License. This is not an official Skill from Ryan McDermott or the upstream maintainers.
- The complete upstream README is not bundled; use the source link to read it.
