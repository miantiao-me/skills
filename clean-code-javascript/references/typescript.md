# TypeScript

Read this reference when reviewing TypeScript configuration, runtime boundaries, state modeling, readonly contracts, or unsafe escapes. Adopt stricter checks in a way that fits the repository's current migration and public compatibility constraints.

## Contents

- [Use strictness as a correctness tool](#use-strictness-as-a-correctness-tool)
- [Validate runtime boundaries](#validate-runtime-boundaries)
- [Narrow values and model states](#narrow-values-and-model-states)
- [Preserve useful inference](#preserve-useful-inference)
- [Design stable public types](#design-stable-public-types)
- [Contain unsafe escapes](#contain-unsafe-escapes)

## Use strictness as a correctness tool

Enable `strict` for new projects when feasible. In an existing project, move toward it incrementally instead of combining a compiler migration with an unrelated refactor. Fix errors by modeling reality, not by adding broad assertions.

`noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are not included in `strict`. They can expose real boundary mistakes, but enable them deliberately, assess ecosystem and declaration-file impact, and migrate in reviewable steps.

With `noUncheckedIndexedAccess`, an indexed read may be absent even when the collection's value type is not optional. Narrow the result or use a data structure whose API better expresses the invariant.

With `exactOptionalPropertyTypes`, `value?: T` means the property may be absent; it does not automatically permit an explicitly present `undefined`. Add `| undefined` only when that is part of the contract.

## Validate runtime boundaries

Use `unknown` for data that has not been established as safe. HTTP JSON, parsed files, storage, messages, environment variables, and third-party callbacks remain runtime values regardless of a compile-time annotation. Validate them with focused predicates or the schema library already used by the project.

```ts
interface UserProfile {
  id: string;
  displayName: string;
}

function isUserProfile(value: unknown): value is UserProfile {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === "string" &&
    typeof candidate.displayName === "string";
}

async function loadUserProfile(id: string): Promise<UserProfile> {
  const response = await fetch(`/api/profiles/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(`Profile request failed with status ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!isUserProfile(payload)) {
    throw new TypeError("Invalid profile response");
  }

  return payload;
}
```

The narrow `Record<string, unknown>` assertion is contained inside the validator after the object check. Do not write `response.json() as UserProfile`: it suppresses the check exactly where trust is lowest.

## Narrow values and model states

Prefer control-flow narrowing, predicates, property checks, and exhaustive switches over casts. Treat caught values as `unknown` and establish whether they are `Error` instances before reading `message` or `stack`.

Represent mutually exclusive states with discriminated unions instead of a bag of optional properties.

```ts
type LoadState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

function renderStatus<T>(state: LoadState<T>): string {
  switch (state.status) {
    case "idle": return "Not started";
    case "loading": return "Loading";
    case "success": return "Loaded";
    case "error": return state.error.message;
  }
}
```

Exhaustiveness is most useful at stable domain boundaries. Do not add a synthetic union when ordinary optional data accurately models the domain.

## Preserve useful inference

Use `satisfies` to check a value against a constraint while retaining its precise inferred shape. Use `as const` when literal values and readonly properties are intentional, not as a replacement for domain modeling.

```ts
const routes = {
  home: "/",
  account: "/account",
} as const satisfies Record<string, `/${string}`>;
```

Use `readonly` parameters and properties to communicate ownership and prevent accidental writes at compile time.

```ts
type User = Readonly<{ id: string; roles: readonly string[] }>;

function hasRole(user: User, role: string): boolean {
  return user.roles.includes(role);
}
```

`readonly` does not freeze values at runtime and is shallow unless nested properties are also readonly. Do not claim it protects data crossing an untrusted JavaScript boundary.

## Design stable public types

Give exported functions, shared contracts, serialization boundaries, and complex APIs explicit, intentional types. Explicit return types at public boundaries prevent incidental implementation details from becoming API. Local obvious functions can rely on inference.

Prefer domain-shaped inputs over generic dictionaries, parallel arrays, positional tuples, and large option bags with unrelated fields. Keep optional properties genuinely optional and document units or side effects that the type cannot express.

Expose the smallest useful contract, but do not create interfaces solely to satisfy a slogan. Structural object types, type aliases, or function types are often enough. Ensure implementations remain substitutable: narrowing accepted inputs or adding surprising side effects violates the contract even if TypeScript accepts an assertion.

## Contain unsafe escapes

Do not ban `any`, type assertions, or non-null assertions absolutely. They may be necessary for untyped libraries, framework lifecycle guarantees, generated code, or temporary migration seams. Keep each escape narrow, explain a non-obvious invariant, validate before the unsafe point when possible, and return a safe type.

Avoid chained casts such as `value as unknown as Target`; they usually indicate a mismodeled contract. Never solve a type error by widening a whole module to `any` when a boundary adapter can contain the uncertainty.
