# Testing and Refactoring

Read this reference when adding tests, reviewing comments and automation, or planning a behavior-preserving cleanup. Keep changes small, evidence-based, and aligned with the repository's existing validation workflow.

## Contents

- [Test observable behavior](#test-observable-behavior)
- [Keep each test concept focused](#keep-each-test-concept-focused)
- [Comment why, not what](#comment-why-not-what)
- [Automate mechanical consistency](#automate-mechanical-consistency)
- [Remove obsolete code](#remove-obsolete-code)
- [Refactor and validate incrementally](#refactor-and-validate-incrementally)
- [Treat rules as heuristics](#treat-rules-as-heuristics)

## Test observable behavior

Test public contracts, outputs, state transitions, side effects, and important failure modes rather than private methods, incidental call order, or internal structure. Prefer deterministic inputs and realistic boundaries. Mock external effects at stable seams instead of mocking every collaborator.

Before a behavior-preserving refactor, identify the tests that protect the affected contract. Add characterization tests when behavior is important but unclear. Do not rewrite tests merely to mirror the new implementation; unchanged behavior should usually keep passing unchanged tests.

Coverage can reveal untested paths but is not proof of useful assertions. Prioritize risk, boundary cases, regressions, and business impact over an arbitrary percentage.

## Keep each test concept focused

A test should communicate one behavior or scenario, not obey a “one assertion” quota. Use all assertions needed to prove that behavior, while separating unrelated scenarios so failures identify the broken contract.

```ts
it("creates a member with notification enabled by default", () => {
  const user = createUser({ name: "Ada", email: "ada@example.test" });

  expect(user.role).toBe("member");
  expect(user.notify).toBe(true);
});
```

Name tests by observable outcome and relevant condition. Keep setup close enough to understand, but extract fixtures and helpers when they remove noise without hiding the scenario.

## Comment why, not what

Comments should explain constraints, trade-offs, workarounds, invariants, units, or surprising decisions that code cannot express. Remove narration of obvious syntax, stale claims, journal entries, and decorative section markers.

Use API documentation when consumers need a contract, units, side effects, failure behavior, or a non-obvious example. Task markers should identify an actionable gap and, when project convention permits, an owner or issue; do not use them as indefinite storage for vague intentions.

Keep callers and closely related helpers near enough to read naturally when local organization permits, but follow repository conventions over rigid vertical ordering.

## Automate mechanical consistency

Delegate formatting, import ordering, enforceable syntax, and type constraints to the project's formatter, linter, compiler, and CI. Prefer focused rules with low false-positive rates; do not treat a large lint preset as a moral scorecard.

Do not churn unrelated formatting in a bounded refactor. If automation and repository style disagree, fix the configuration or follow the established workflow instead of manually oscillating between styles.

## Remove obsolete code

Delete dead branches, unused exports, superseded adapters, and stale feature flags after confirming they have no supported callers. Version control retains history; commented-out code and change-log comments inside source make the current behavior harder to see.

Remove obsolete tests and documentation with the code they described. Do not delete apparently unused public API without checking package consumers, reflection, dynamic imports, framework registration, and generated entry points.

## Refactor and validate incrementally

Choose the smallest refactor that resolves the concrete maintainability problem. Separate structural cleanup from behavior changes when practical, preserve public compatibility unless change is requested, and stop before a bounded request becomes a rewrite.

Validate from fast and focused to broad, using commands already defined by the project:

1. Run the nearest affected tests or a focused reproduction.
2. Run the relevant type check and lint/format checks.
3. Run the broader test suite.
4. Run the build or packaging check when output, modules, or public types changed.

The exact order can change when a repository has a faster canonical command. Report skipped or unavailable checks and remaining behavioral risk. Measure performance-sensitive changes rather than assuming an abstraction is free or expensive.

## Treat rules as heuristics

- Preserve correctness, types, compatibility, and failure semantics before improving style.
- Do not extract by line count, parameter count, nesting depth, or coverage percentage alone.
- Do not apply DRY until repeated code represents one stable concept.
- Do not force functions, classes, ESM, `async`/`await`, or immutability where project constraints favor another clear design.
- Do not require explicit return types everywhere or ban every assertion and `any`; contain unsafety at justified boundaries.
- Do not introduce unsupported syntax or combine platform migration with an unrelated cleanup.
- Prefer local consistency when several designs are equally clear.
- Keep justified exceptions when they make a boundary safer or the code easier to maintain.
