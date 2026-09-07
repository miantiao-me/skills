# Design and Modules

Read this reference when shaping objects, classes, module boundaries, dependencies, or shared abstractions. Use these design heuristics only where the code has a concrete boundary or reason to change.

## Contents

- [Model data around behavior](#model-data-around-behavior)
- [Encapsulate invariants](#encapsulate-invariants)
- [Choose functions, composition, and classes by fit](#choose-functions-composition-and-classes-by-fit)
- [Apply SOLID at meaningful boundaries](#apply-solid-at-meaningful-boundaries)
- [Keep dependencies pointing inward](#keep-dependencies-pointing-inward)
- [Respect the module system](#respect-the-module-system)
- [Deduplicate stable concepts](#deduplicate-stable-concepts)

## Model data around behavior

Use objects and data structures that make valid operations and states obvious. Prefer a domain record over parallel arrays, positional tuples, magic strings, or a bag of unrelated optional fields. Use `Map` and `Set` when key identity or uniqueness is the actual semantic, not merely because they are available.

Data-only values are often appropriate at serialization and UI boundaries. Behavior-rich objects are useful when operations must preserve invariants. Do not hide plain data behind getters and setters that add no validation, policy, or compatibility value.

Keep consumers from depending on incidental representation. A focused method can protect an invariant without turning every property read into ceremony.

```ts
class Account {
  #balanceCents = 0;

  deposit(amountCents: number): void {
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
      throw new RangeError("Deposit must be a positive integer number of cents");
    }
    const nextBalanceCents = this.#balanceCents + amountCents;
    if (!Number.isSafeInteger(nextBalanceCents)) {
      throw new RangeError("Account balance exceeds the safe integer range");
    }
    this.#balanceCents = nextBalanceCents;
  }

  get balanceCents(): number {
    return this.#balanceCents;
  }
}
```

## Encapsulate invariants

Expose the smallest API that allows useful work while keeping state valid. Closures can encapsulate small state; modules can own shared resources; classes can guard identity and lifecycle. Avoid mutable globals and public fields that callers can place into invalid combinations.

Use JavaScript `#private` fields when runtime privacy is required and the target supports their emitted semantics. TypeScript `private` is a compile-time restriction whose runtime behavior depends on output; choose it when that trade-off matches the project.

Encapsulation is not secrecy for its own sake. If a plain immutable value has no invariant to protect, direct properties are simpler.

## Choose functions, composition, and classes by fit

Use functions for stateless transformations and closures for small, locally owned state. Use classes when identity, lifecycle, mutable invariants, framework conventions, or polymorphic behavior make them clearer.

Prefer composition over deep inheritance when capabilities vary independently. Inject behavior as a function or narrow object rather than coupling domain logic to transport, storage, or framework details.

```ts
type User = Readonly<{ id: string; name: string }>;
type FindUser = (id: string) => Promise<User | undefined>;

function withUserCache(findUser: FindUser): FindUser {
  const cache = new Map<string, User>();

  return async (id) => {
    const cached = cache.get(id);
    if (cached !== undefined) return cached;

    const user = await findUser(id);
    if (user !== undefined) cache.set(id, user);
    return user;
  };
}
```

Inheritance is reasonable for a stable substitutable “is-a” relationship or a framework extension point. A subtype must preserve the base contract; if it changes accepted inputs, outputs, invariants, or side effects, composition is usually safer.

## Apply SOLID at meaningful boundaries

Interpret single responsibility as one cohesive reason to change, not one method per class. Separate authentication policy from profile presentation when they change for different stakeholders; keep tightly coupled steps together when splitting them would scatter one concept.

Make extension points only around demonstrated variation. Open/closed design does not require a plugin architecture for every conditional. Segregate large contracts when consumers need genuinely different capabilities, not by creating one-method interfaces everywhere.

Dependency inversion is about policy not owning volatile details. It can use function parameters, constructors, factories, or module wiring; a dependency injection container is optional. Avoid interface rituals that add names and files without reducing coupling.

## Keep dependencies pointing inward

Domain decisions should not construct or import concrete network, database, clock, or logging implementations when those details vary. Pass narrow capabilities inward and assemble concrete dependencies at an application boundary.

```ts
interface InventoryPort {
  requestItem(sku: string): Promise<void>;
}

async function requestInventory(
  skus: readonly string[],
  inventory: InventoryPort,
): Promise<void> {
  for (const sku of skus) {
    await inventory.requestItem(sku);
  }
}
```

Do not inject stable language utilities or every tiny pure helper. Indirection is valuable when it protects policy, enables substitution, or controls an effect—not as an end in itself.

## Respect the module system

Prefer standard ESM for a new project when its runtimes and tools support it. During a focused refactor, preserve the repository's ESM or CommonJS convention unless migration is requested. Respect package `exports`, file extensions, resolution mode, test runner behavior, side-effect imports, and CJS/ESM interop.

Use `import type` and `export type` when they make type-only dependencies explicit and align with compiler settings. Do not convert a required runtime import into a type import, and preserve intentionally ordered side-effect imports.

Keep module boundaries cohesive. Public entry points should expose intentional contracts rather than internal file layout; avoid circular imports and deep imports into another package's private paths.

## Deduplicate stable concepts

Remove duplication when repeated code represents the same policy and should change together. First identify what is invariant and what varies; then choose the smallest function, data table, object, or module that names that concept.

Similar-looking code may encode different business rules. Prefer a little duplication to a shared abstraction filled with flags, callbacks, and exceptions. Wait for a pattern to stabilize, and remove an abstraction when it makes callers harder to understand than the repeated code did.
