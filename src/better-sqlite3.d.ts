/**
 * Minimal ambient type shim for `better-sqlite3`.
 * The package ships no bundled types and `@types/better-sqlite3` is not
 * installed, so we declare only the small surface this app uses. This keeps
 * `tsc --noEmit` happy without adding a new dependency.
 */
declare module 'better-sqlite3' {
  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  interface Statement {
    run(...params: unknown[]): RunResult;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }

  interface Database {
    prepare(source: string): Statement;
    exec(source: string): Database;
    pragma(source: string): unknown;
    close(): Database;
  }

  interface DatabaseConstructor {
    new (filename: string, options?: Record<string, unknown>): Database;
    (filename: string, options?: Record<string, unknown>): Database;
  }

  const Database: DatabaseConstructor;
  export default Database;
}
