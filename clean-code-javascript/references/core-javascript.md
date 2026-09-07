# Core JavaScript

Read this reference when reviewing JavaScript fundamentals, function shape, naming, mutation, or side effects. Apply it against the project's real runtime and observable behavior rather than assuming every modern feature is available.

## Contents

- [Start with constraints and behavior](#start-with-constraints-and-behavior)
- [Choose clear, consistent names](#choose-clear-consistent-names)
- [Use declarations and operators deliberately](#use-declarations-and-operators-deliberately)
- [Design focused functions](#design-focused-functions)
- [Make ownership and mutation explicit](#make-ownership-and-mutation-explicit)
- [Separate decisions from effects](#separate-decisions-from-effects)

## Start with constraints and behavior

Before editing, inspect the runtime and browser targets, `package.json`, build tools, module format, compiler settings, lint and format rules, tests, public contracts, and repository instructions. Prefer syntax and APIs supported by that environment; a locally consistent fallback is cleaner than an unsupported feature.

Establish observable inputs, outputs, side effects, ordering, and failure behavior from tests and call sites. Preserve them unless a behavior or platform change is explicit. When important legacy behavior is unclear, add a characterization test if the project has a suitable test setup.

## Choose clear, consistent names

Names should reveal domain meaning, units, and intent. Use one vocabulary term for one concept across modules: do not alternate among `user`, `client`, and `customer` unless they are genuinely different domain roles. Prefer pronounceable names over private abbreviations and positive booleans such as `isEnabled` over double negatives.

Make important values searchable. Replace unexplained literals with a named constant when the name conveys a policy or unit, but do not name every obvious literal.

```js
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

setTimeout(expireSession, SESSION_TIMEOUT_MS);
```

Avoid redundant context. Inside an `invoice`, prefer `totalCents` to `invoiceTotalAmountInCents`; at a wider scope, include enough context to distinguish the value. Use explanatory variables when they make a dense condition or transformation readable.

## Use declarations and operators deliberately

Use `const` by default and `let` only for intentional reassignment. Avoid `var` in modern code unless preserving a compatibility-sensitive legacy behavior.

Use optional chaining only when absence is valid. Use nullish coalescing for defaults when `0`, `false`, and `""` are meaningful values. `||` is correct when every falsy value should trigger the fallback; do not replace it mechanically.

```js
const retries = options.retries ?? 3;
const city = user?.address?.city;
```

Default parameters apply only to `undefined`. Choose them when omission has a default, and handle `null` separately if it has domain meaning.

Prefer straightforward control flow. Early returns can flatten exceptional paths and reveal the main path, while nested ternaries and clever short-circuit expressions often conceal evaluation order.

## Design focused functions

Give a function one coherent responsibility and one useful level of abstraction. Extract code when a meaningful name exposes policy, isolates a side effect, simplifies complex branching, or creates a useful test seam. Do not fragment obvious code into ceremonial one-line wrappers.

Function names should state the result or effect. Prefer explicit parameters and return values over ambient globals. Keep a few obvious positional arguments positional; use a parameter object when arguments form one concept, are optional, are easy to transpose, or evolve independently.

```js
function calculateSubtotal(unitPriceCents, quantity) {
  return unitPriceCents * quantity;
}

function createUser({ name, email, role = "member", notify = true }) {
  return { name, email, role, notify };
}
```

A boolean argument is not inherently wrong, but it can hide two distinct operations. Prefer separate names or a domain option when callers otherwise need to remember what `true` means.

```js
function getReportPath(name) {
  return `reports/${name}`;
}

function getTemporaryReportPath(name) {
  return `temporary-reports/${name}`;
}
```

Use data operations that express intent, but do not replace a clear loop merely to appear functional. Measure performance-sensitive changes instead of relying on folklore.

## Make ownership and mutation explicit

Do not mutate caller-owned arrays or objects unless the API clearly promises in-place mutation. Prefer copied updates so callers can reason about snapshots and retries.

```js
function addCartItem(cart, item, addedAt) {
  return [...cart, { item, addedAt }];
}

function sortUsersByName(users) {
  return users.toSorted((left, right) => left.name.localeCompare(right.name));
}
```

Use `[...users].sort(...)` when `toSorted` is not supported by the target. A shallow copy does not clone nested objects; copy at the level actually being changed. Local mutation can be clearer or faster inside an owned implementation, but do not leak it across the boundary.

Avoid modifying built-in prototypes or shared globals. Prefer ordinary functions, modules, or explicitly owned types so behavior does not depend on import order or global collisions.

## Separate decisions from effects

Pure functions are a strong default for calculations and decisions. Pass clocks, randomness, configuration, and external data explicitly when doing so makes behavior deterministic.

```js
function isExpired(expiresAt, now) {
  return expiresAt.getTime() <= now.getTime();
}

function expireIfNeeded(session, now, deleteSession) {
  if (isExpired(session.expiresAt, now)) {
    deleteSession(session.id);
  }
}
```

Keep network, storage, logging, process state, and UI effects visible at boundaries rather than scattering them through domain logic. Do not force purity when state is the domain: encapsulate necessary mutation, define its owner, and expose an API that preserves invariants.
