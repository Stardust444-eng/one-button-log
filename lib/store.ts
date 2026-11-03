import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { demoBoard } from "./demo-seed";
import { HttpError } from "./http";
import { templateById } from "./templates";
import type { PublicBoard, PublicButton, PublicTap } from "./types";

type BoardRow = {
  id: string;
  view_id: string;
  name: string;
  demo: number;
  untouched: number;
  created_at: string;
};

type ButtonRow = {
  id: string;
  label: string;
  interval_hours: number | null;
  position: number;
};

type TapRow = {
  id: string;
  button_id: string;
  by_name: string;
  at: string | null;
  offset_ms: number | null;
};

type SeedButton = {
  id?: string;
  label: string;
  intervalHours: number | null;
  taps?: { id?: string; by: string; offsetMs: number }[];
};

const globalForDb = globalThis as unknown as { __oneButtonDb?: DatabaseSync };

function databasePath(): string {
  return process.env.ONE_BUTTON_DB ?? path.join(process.cwd(), "data", "one-button-log.sqlite");
}

function getDb(): DatabaseSync {
  if (!globalForDb.__oneButtonDb) {
    const filename = databasePath();
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    const db = new DatabaseSync(filename);
    db.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 3000;
      CREATE TABLE IF NOT EXISTS boards (
        id TEXT PRIMARY KEY,
        view_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        demo INTEGER NOT NULL DEFAULT 0,
        untouched INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS buttons (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL,
        label TEXT NOT NULL,
        interval_hours REAL,
        position INTEGER NOT NULL,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS taps (
        id TEXT PRIMARY KEY,
        button_id TEXT NOT NULL,
        by_name TEXT NOT NULL,
        at TEXT,
        offset_ms INTEGER,
        FOREIGN KEY (button_id) REFERENCES buttons(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS buttons_board ON buttons(board_id, position);
      CREATE INDEX IF NOT EXISTS taps_button ON taps(button_id);
    `);
    ensureDemo(db);
    globalForDb.__oneButtonDb = db;
  }
  return globalForDb.__oneButtonDb;
}

function newId(): string {
  return randomBytes(16).toString("base64url");
}

function transaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* already closed */
    }
    throw error;
  }
}

function insertButtons(db: DatabaseSync, boardId: string, buttons: SeedButton[]) {
  const insertButton = db.prepare(
    "INSERT INTO buttons (id, board_id, label, interval_hours, position) VALUES (?, ?, ?, ?, ?)",
  );
  const insertTap = db.prepare(
    "INSERT INTO taps (id, button_id, by_name, at, offset_ms) VALUES (?, ?, ?, NULL, ?)",
  );
  buttons.forEach((button, index) => {
    const buttonId = button.id ?? newId();
    insertButton.run(buttonId, boardId, button.label, button.intervalHours, index);
    for (const tap of button.taps ?? []) {
      insertTap.run(tap.id ?? newId(), buttonId, tap.by, tap.offsetMs);
    }
  });
}

function ensureDemo(db: DatabaseSync) {
  const existing = db.prepare("SELECT id FROM boards WHERE id = ?").get(demoBoard.id);
  if (existing) return;
  transaction(db, () => {
    db.prepare(
      "INSERT INTO boards (id, view_id, name, demo, untouched, created_at) VALUES (?, ?, ?, 1, 1, ?)",
    ).run(demoBoard.id, demoBoard.viewId, demoBoard.name, new Date().toISOString());
    insertButtons(db, demoBoard.id, demoBoard.buttons);
  });
}

function findBoard(db: DatabaseSync, key: string): BoardRow | undefined {
  return db.prepare("SELECT * FROM boards WHERE id = ? OR view_id = ?").get(key, key) as
    | BoardRow
    | undefined;
}

function requireBoard(db: DatabaseSync, key: string): { row: BoardRow; role: "edit" | "view" } {
  const row = findBoard(db, key);
  if (!row) throw new HttpError(404, "No board for this link.");
  return { row, role: row.id === key ? "edit" : "view" };
}

function requireEdit(db: DatabaseSync, key: string): BoardRow {
  const { row, role } = requireBoard(db, key);
  if (role !== "edit") throw new HttpError(403, "This link is view only.");
  return row;
}

function freezeDemo(db: DatabaseSync, row: BoardRow, now: number) {
  if (!row.untouched) return;
  const taps = db
    .prepare(
      `SELECT taps.id, taps.offset_ms
       FROM taps
       JOIN buttons ON buttons.id = taps.button_id
       WHERE buttons.board_id = ?`,
    )
    .all(row.id) as unknown as { id: string; offset_ms: number | null }[];
  const update = db.prepare("UPDATE taps SET at = ?, offset_ms = NULL WHERE id = ?");
  for (const tap of taps) {
    if (tap.offset_ms == null) continue;
    update.run(new Date(now + tap.offset_ms).toISOString(), tap.id);
  }
  db.prepare("UPDATE boards SET untouched = 0 WHERE id = ?").run(row.id);
  row.untouched = 0;
}

function present(db: DatabaseSync, row: BoardRow, role: "edit" | "view", now: number): PublicBoard {
  const buttons = db
    .prepare(
      "SELECT id, label, interval_hours, position FROM buttons WHERE board_id = ? ORDER BY position ASC",
    )
    .all(row.id) as unknown as ButtonRow[];
  const taps = db
    .prepare(
      `SELECT taps.id, taps.button_id, taps.by_name, taps.at, taps.offset_ms
       FROM taps
       JOIN buttons ON buttons.id = taps.button_id
       WHERE buttons.board_id = ?`,
    )
    .all(row.id) as unknown as TapRow[];

  const byButton = new Map<string, PublicTap[]>();
  for (const tap of taps) {
    const atMs =
      row.untouched && tap.offset_ms != null
        ? now + tap.offset_ms
        : tap.at
          ? Date.parse(tap.at)
          : Number.NaN;
    if (!Number.isFinite(atMs)) continue;
    const list = byButton.get(tap.button_id) ?? [];
    list.push({ id: tap.id, by: tap.by_name, at: new Date(atMs).toISOString() });
    byButton.set(tap.button_id, list);
  }

  const publicButtons: PublicButton[] = buttons.map((button) => {
    const list = byButton.get(button.id) ?? [];
    list.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
    return {
      id: button.id,
      label: button.label,
      intervalHours: button.interval_hours,
      taps: list.slice(0, 100),
    };
  });

  return {
    name: row.name,
    demo: row.demo === 1,
    role,
    viewId: role === "edit" ? row.view_id : null,
    buttons: publicButtons,
  };
}

function buttonOnBoard(db: DatabaseSync, boardId: string, buttonId: string): ButtonRow {
  const button = db
    .prepare(
      "SELECT id, label, interval_hours, position FROM buttons WHERE id = ? AND board_id = ?",
    )
    .get(buttonId, boardId) as unknown as ButtonRow | undefined;
  if (!button) throw new HttpError(404, "That button isn't on this board.");
  return button;
}

function trimTaps(db: DatabaseSync, buttonId: string) {
  const rows = db
    .prepare("SELECT id, at, offset_ms FROM taps WHERE button_id = ?")
    .all(buttonId) as unknown as { id: string; at: string | null; offset_ms: number | null }[];
  if (rows.length <= 200) return;
  const now = Date.now();
  const sorted = rows
    .map((row) => ({
      id: row.id,
      ms: row.at ? Date.parse(row.at) : now + (row.offset_ms ?? 0),
    }))
    .sort((a, b) => a.ms - b.ms);
  const extra = sorted.length - 200;
  const remove = db.prepare("DELETE FROM taps WHERE id = ?");
  for (let i = 0; i < extra; i += 1) remove.run(sorted[i].id);
}

export function createBoard(name: string, templateId: string): { id: string; viewId: string } {
  const template = templateById(templateId);
  if (!template) throw new HttpError(400, "Pick a template.");
  const db = getDb();
  const id = newId();
  const viewId = newId();
  transaction(db, () => {
    db.prepare(
      "INSERT INTO boards (id, view_id, name, demo, untouched, created_at) VALUES (?, ?, ?, 0, 0, ?)",
    ).run(id, viewId, name, new Date().toISOString());
    insertButtons(db, id, template.buttons);
  });
  return { id, viewId };
}

export function readBoard(key: string): { board: PublicBoard } {
  const db = getDb();
  const { row, role } = requireBoard(db, key);
  return { board: present(db, row, role, Date.now()) };
}

export function logTap(
  key: string,
  buttonId: string,
  by: string,
): { board: PublicBoard; tapId: string } {
  const db = getDb();
  const now = Date.now();
  const tapId = newId();
  const board = transaction(db, () => {
    const row = requireEdit(db, key);
    buttonOnBoard(db, row.id, buttonId);
    freezeDemo(db, row, now);
    db.prepare("INSERT INTO taps (id, button_id, by_name, at, offset_ms) VALUES (?, ?, ?, ?, NULL)").run(
      tapId,
      buttonId,
      by,
      new Date(now).toISOString(),
    );
    trimTaps(db, buttonId);
    return present(db, row, "edit", now);
  });
  return { board, tapId };
}

export function updateTap(
  key: string,
  tapId: string,
  by: string,
  at: string,
): { board: PublicBoard } {
  const db = getDb();
  const now = Date.now();
  const board = transaction(db, () => {
    const row = requireEdit(db, key);
    freezeDemo(db, row, now);
    const tap = db
      .prepare(
        `SELECT taps.id
         FROM taps
         JOIN buttons ON buttons.id = taps.button_id
         WHERE taps.id = ? AND buttons.board_id = ?`,
      )
      .get(tapId, row.id);
    if (!tap) throw new HttpError(404, "That tap is already gone.");
    db.prepare("UPDATE taps SET by_name = ?, at = ?, offset_ms = NULL WHERE id = ?").run(by, at, tapId);
    return present(db, row, "edit", now);
  });
  return { board };
}

export function removeTap(key: string, tapId: string): { board: PublicBoard } {
  const db = getDb();
  const now = Date.now();
  const board = transaction(db, () => {
    const row = requireEdit(db, key);
    freezeDemo(db, row, now);
    const result = db
      .prepare(
        `DELETE FROM taps
         WHERE id = ?
           AND button_id IN (SELECT id FROM buttons WHERE board_id = ?)`,
      )
      .run(tapId, row.id);
    if (Number(result.changes) === 0) throw new HttpError(404, "That tap is already gone.");
    return present(db, row, "edit", now);
  });
  return { board };
}

export function addButton(
  key: string,
  label: string,
  intervalHours: number | null,
): { board: PublicBoard } {
  const db = getDb();
  const now = Date.now();
  const board = transaction(db, () => {
    const row = requireEdit(db, key);
    freezeDemo(db, row, now);
    const max = db
      .prepare("SELECT COALESCE(MAX(position), -1) AS max_pos FROM buttons WHERE board_id = ?")
      .get(row.id) as unknown as { max_pos: number };
    db.prepare(
      "INSERT INTO buttons (id, board_id, label, interval_hours, position) VALUES (?, ?, ?, ?, ?)",
    ).run(newId(), row.id, label, intervalHours, Number(max.max_pos) + 1);
    return present(db, row, "edit", now);
  });
  return { board };
}

export function updateButton(
  key: string,
  buttonId: string,
  label: string,
  intervalHours: number | null,
): { board: PublicBoard } {
  const db = getDb();
  const now = Date.now();
  const board = transaction(db, () => {
    const row = requireEdit(db, key);
    freezeDemo(db, row, now);
    buttonOnBoard(db, row.id, buttonId);
    db.prepare("UPDATE buttons SET label = ?, interval_hours = ? WHERE id = ?").run(
      label,
      intervalHours,
      buttonId,
    );
    return present(db, row, "edit", now);
  });
  return { board };
}

export function removeButton(key: string, buttonId: string): { board: PublicBoard } {
  const db = getDb();
  const now = Date.now();
  const board = transaction(db, () => {
    const row = requireEdit(db, key);
    freezeDemo(db, row, now);
    buttonOnBoard(db, row.id, buttonId);
    db.prepare("DELETE FROM buttons WHERE id = ? AND board_id = ?").run(buttonId, row.id);
    return present(db, row, "edit", now);
  });
  return { board };
}

export function resetDemo(key: string): { board: PublicBoard } {
  const db = getDb();
  const now = Date.now();
  const board = transaction(db, () => {
    const row = requireEdit(db, key);
    if (row.demo !== 1) throw new HttpError(400, "Only the demo board can be reset.");
    db.prepare("DELETE FROM buttons WHERE board_id = ?").run(row.id);
    insertButtons(db, row.id, demoBoard.buttons);
    db.prepare("UPDATE boards SET untouched = 1, name = ? WHERE id = ?").run(demoBoard.name, row.id);
    row.untouched = 1;
    row.name = demoBoard.name;
    return present(db, row, "edit", now);
  });
  return { board };
}
