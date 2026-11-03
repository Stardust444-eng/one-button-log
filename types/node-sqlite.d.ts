declare module "node:sqlite" {
  export type SQLInputValue = string | number | bigint | null | Uint8Array;

  export interface StatementResultingChanges {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  }

  export interface StatementSync {
    all(...params: SQLInputValue[]): Record<string, SQLInputValue>[];
    get(...params: SQLInputValue[]): Record<string, SQLInputValue> | undefined;
    run(...params: SQLInputValue[]): StatementResultingChanges;
  }

  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
