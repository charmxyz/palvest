import "server-only";
import type postgres from "postgres";
import { createSql } from "./pg";

declare global {
  var __palvestSql: postgres.Sql | undefined;
}

/** Shared pool, created on first use and reused across hot reloads and warm invocations. */
export function db(): postgres.Sql {
  return (globalThis.__palvestSql ??= createSql());
}
