# Async and Errors

Read this reference when reviewing promises, concurrency, cancellation, asynchronous iteration, or error boundaries. Preserve the application's existing ordering, retry, cancellation, and failure contracts unless a change is explicit.

## Contents

- [Choose the clearest promise form](#choose-the-clearest-promise-form)
- [Make concurrency intentional](#make-concurrency-intentional)
- [Propagate cancellation](#propagate-cancellation)
- [Await asynchronous iteration](#await-asynchronous-iteration)
- [Account for every promise](#account-for-every-promise)
- [Preserve error context](#preserve-error-context)
- [Choose exceptions or result values at boundaries](#choose-exceptions-or-result-values-at-boundaries)

## Choose the clearest promise form

Use `async`/`await` when it clarifies sequencing, local error handling, or cleanup. Return a Promise chain when it expresses a direct transformation more clearly. Both have the same underlying promise semantics; do not rewrite one form merely to satisfy a style preference.

```ts
interface AvatarStore {
  load(id: string): Promise<File>;
  save(id: string, file: File): Promise<void>;
}

function readDisplayName(
  user: Promise<{ displayName: string }>,
): Promise<string> {
  return user.then((value) => value.displayName);
}

async function replaceAvatar(
  store: AvatarStore,
  id: string,
  file: File,
): Promise<void> {
  const previous = await store.load(id);
  try {
    await store.save(id, file);
  } catch (error: unknown) {
    try {
      await store.save(id, previous);
    } catch (rollbackError: unknown) {
      throw new AggregateError(
        [error, rollbackError],
        "Failed to replace avatar and roll back the previous avatar",
      );
    }
    throw error;
  }
}
```

Do not wrap an existing promise in `new Promise` unless adapting a callback or event API that genuinely requires a new settlement contract. Document whether an asynchronous API can reject, retry, or resolve before a side effect completes.

## Make concurrency intentional

Use sequential awaits when order, dependencies, rate limits, transaction boundaries, or resource pressure require them. Use `Promise.all` for independent operations that should fail fast as a group. Use `Promise.allSettled` when every outcome must be observed.

```ts
// Each migration depends on the previous schema state.
async function applyMigrations(
  migrations: readonly (() => Promise<void>)[],
): Promise<void> {
  for (const applyMigration of migrations) {
    await applyMigration();
  }
}

// These reads are independent and the page requires both.
async function loadPageData<Profile, Permissions>(
  loadProfile: () => Promise<Profile>,
  loadPermissions: () => Promise<Permissions>,
): Promise<[Profile, Permissions]> {
  return Promise.all([loadProfile(), loadPermissions()]);
}
```

The aggregate promise returned by `Promise.all` rejects when one input rejects, but it does not cancel sibling operations that already started. A rejected aggregate is not a rollback. Propagate cancellation explicitly where supported, and consider partial side effects, cleanup, and idempotency before introducing concurrency.

`Promise.allSettled` reports all outcomes but does not make failures successful. Inspect rejected entries and define what the caller should do. Limit concurrency when unbounded fan-out can exhaust sockets, memory, API quotas, or database pools.

## Propagate cancellation

Use `AbortSignal` when the underlying APIs support cancellation. Accept the signal at the public operation and pass the same signal through every cancellable child; creating a signal without propagation provides no cancellation.

```ts
async function downloadReport(
  reportId: string,
  signal: AbortSignal,
): Promise<string> {
  const response = await fetch(
    `/api/reports/${encodeURIComponent(reportId)}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`Report request failed with status ${response.status}`);
  }

  return response.text();
}
```

For custom long-running work, check `signal.aborted` or call `signal.throwIfAborted()` where supported by the target. Remove event listeners and release resources during cleanup. Decide at the application boundary whether an abort is silent user intent, a reportable failure, or a retry signal.

## Await asynchronous iteration

An `async` callback passed to `forEach` is ignored by `forEach`; the outer function can finish before callbacks settle, and rejections may become unhandled.

```ts
// Sequential: ordering and backpressure are required.
for (const message of messages) {
  await sendMessage(message);
}

// Concurrent: sends are independent and fan-out is known to be safe.
await Promise.all(messages.map((message) => sendMessage(message)));
```

Use `for await...of` for async iterables. Do not use sequential loops or unlimited mapping by habit—choose based on the contract and resource limits.

## Account for every promise

Await, return, collect, or deliberately detach every promise. Floating promises lose completion and rejection semantics and can let a request, process, or test finish too early.

For intentional fire-and-forget work, make the detachment and error policy visible:

```ts
void refreshCache().catch((error: unknown) => {
  reportBackgroundError(error);
});
```

Use the project's lint rules to catch accidental floating promises. Do not use `void` merely to silence the rule when the caller should wait or propagate failure.

## Preserve error context

Treat caught values as `unknown`; JavaScript can throw any value. Narrow before reading properties. Catch only where the layer can recover, translate, add useful context, release resources, or map the failure to a boundary response.

```ts
async function loadOrder(id: string): Promise<Order> {
  try {
    return await orderRepository.load(id);
  } catch (error: unknown) {
    throw new Error(`Failed to load order ${id}`, { cause: error });
  }
}
```

Use `Error` causes when supported by the target so the original stack and value remain available. Avoid swallowing failures, logging and rethrowing at every layer, or exposing internal messages and stacks across trust boundaries. A catch block needs an explicit outcome: recovery, translation, propagation, or intentional suppression with justification.

## Choose exceptions or result values at boundaries

Throw for exceptional failures when normal work cannot continue and an error boundary should unwind the operation. Use a discriminated result for expected, recoverable outcomes that callers routinely branch on.

```ts
type ParsePortResult =
  | { ok: true; port: number }
  | { ok: false; reason: "missing" | "not-an-integer" | "out-of-range" };
```

Define the choice at a meaningful boundary and follow the project's established model. Do not introduce a second error system without a concrete benefit, return `undefined` for failures that need explanation, or mix thrown and returned failures unpredictably in one API.
