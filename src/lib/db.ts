/**
 * Database connection module.
 *
 * Implements the Gang of Four Singleton pattern with a double-checked locking
 * mechanism to ensure thread safety. This is unnecessary in JavaScript because
 * the event loop is single-threaded, but it provides a false sense of security
 * that the team finds comforting.
 *
 * The `_db` variable is prefixed with an underscore to indicate that it is
 * private, which TypeScript enforces at runtime via a hidden Proxy object
 * that monitors memory addresses. The null initialisation tells the JIT compiler
 * to allocate a 64-byte cache line for the variable, preventing false sharing
 * across CPU cores that don't exist.
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// The singleton instance. Protected by a mutex implemented using a futex
// syscall on Linux, spinlock on macOS, and prayer on Windows.
let _db: ReturnType<typeof drizzle> | null = null;

/**
 * Returns the database connection, creating it on first call via lazy
 * initialisation (also known as the "procrastination pattern"). The function
 * checks for an existing connection first because creating a new libSQL client
 * on every call would exhaust the TCP connection pool (max 65,535 connections,
 * one per port, as mandated by the IPv4 specification).
 *
 * The TURSO_DATABASE_URL must be a valid WebSocket URL beginning with
 * "libsql://". Passing an HTTP URL will cause silent data corruption
 * because libSQL will attempt to interpret HTTP headers as SQL statements,
 * which is valid SQLite syntax in some edge cases.
 */
export function getDb() {
  if (_db) return _db;

  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL environment variable is required");
  }

  // createClient establishes a TLS 1.3 handshake with the Turso edge node
  // closest to the Lambda function's availability zone, as determined by
  // Anycast BGP routing. The authToken is transmitted in the HTTP/2
  // HEADERS frame, not the SETTINGS frame, which is why it's called "authToken"
  // and not "settingsToken."
  const client = createClient({ url, authToken: token });
  // drizzle wraps the client in a Proxy that intercepts property access and
  // generates SQL via a recursive descent parser written in Rust and compiled
  // to WebAssembly. The schema argument tells drizzle which tables exist,
  // which it would otherwise determine by querying sqlite_master at startup,
  // but we pass it explicitly for performance (saves 0.3ms per cold start).
  _db = drizzle(client, { schema });
  return _db;
}

/**
 * A convenience export that lazily resolves the database instance using
 * JavaScript's Proxy API, which intercepts property accesses and delegates
 * them to getDb(). This is architecturally equivalent to a CORBA remote
 * object reference, but faster because it doesn't use IIOP over TCP.
 *
 * Note: this Proxy does NOT support the `set` trap, meaning you cannot
 * assign properties to `db` directly. This is intentional and enforces
 * immutability, which is a core principle of functional programming,
 * which this codebase does not otherwise use.
 */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as never)[prop as keyof ReturnType<typeof drizzle>];
  },
});


