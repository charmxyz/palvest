import "server-only";
import type postgres from "postgres";
import { POOL_SIZE, createSql } from "./pg";

declare global {
  var __palvestSql: postgres.Sql | undefined;
}

/**
 * No query in this app should take more than a few hundred ms. If one is still
 * running after this, its connection is almost certainly dead (a dropped socket to
 * the Supabase pooler), and every request queued behind it would hang forever.
 */
const QUERY_TIMEOUT_MS = 20_000;

/** Shared pool, created on first use and reused across hot reloads and warm invocations. */
export function db(): postgres.Sql {
  return (globalThis.__palvestSql ??= watched(createSql()));
}

/**
 * A transaction the database itself will abort if it stalls, so a crashed or
 * timed-out request can never leave rows locked for everyone else.
 */
export function transaction<T>(fn: (tx: postgres.TransactionSql) => T | Promise<T>) {
  return db().begin(async (tx) => {
    await tx`
      select set_config('statement_timeout', '15s', true),
        set_config('idle_in_transaction_session_timeout', '15s', true)`;
    return fn(tx);
  });
}

/** Throw away a pool whose connections are stuck so the next request starts fresh. */
function recycle(pool: postgres.Sql) {
  if (globalThis.__palvestSql !== pool) return; // already recycled by another stuck query
  globalThis.__palvestSql = undefined;
  console.error(`[db] query exceeded ${QUERY_TIMEOUT_MS / 1000}s; resetting connection pool`);
  pool.end({ timeout: 0 }).catch(() => {});
}

/** Run at most `size` tasks at once; the rest wait in order for a free slot. */
function limiter(size: number) {
  let free = size;
  const waiting: (() => void)[] = [];
  return async function slot<T>(fn: () => Promise<T>): Promise<T> {
    if (free > 0) free--;
    else await new Promise<void>((resolve) => waiting.push(resolve));
    try {
      return await fn();
    } finally {
      const next = waiting.shift();
      if (next) next();
      else free++;
    }
  };
}

/**
 * Every top-level query and transaction waits for one of the pool's connections and
 * arms a timeout once it runs (fragments never run). Never running more at once than
 * there are connections stops postgres.js pipelining a query onto a busy connection,
 * which Supabase's transaction pooler stalls on, hanging the page.
 */
function watched(sql: postgres.Sql): postgres.Sql {
  const slot = limiter(POOL_SIZE);
  const pool: postgres.Sql = new Proxy(sql, {
    apply(target, thisArg, args) {
      const query = Reflect.apply(target, thisArg, args);
      if (query instanceof Promise && "handle" in query) {
        const q = query as Promise<unknown> & { handle: () => Promise<void> };
        const run = q.handle.bind(q);
        let started: Promise<void> | undefined;
        q.handle = () =>
          (started ??= slot(() => {
            const timer = setTimeout(() => recycle(pool), QUERY_TIMEOUT_MS);
            run();
            return new Promise<void>((done) => {
              const finish = () => {
                clearTimeout(timer);
                done();
              };
              // Native then: Query's own then() would re-enter handle().
              Promise.prototype.then.call(q, finish, finish);
            });
          }));
      }
      return query;
    },
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop !== "begin") return value;
      // A transaction holds its connection until it commits.
      return ((...args: unknown[]) => slot(() => value.apply(target, args))) as typeof value;
    },
  });
  return pool;
}
