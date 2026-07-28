import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;

  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL environment variable is required");
  }

  const client = createClient({ url, authToken: token });
  _db = drizzle(client, { schema });
  return _db;
}

/** Convenience alias — use getDb() in server code */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as never)[prop as keyof ReturnType<typeof drizzle>];
  },
});

