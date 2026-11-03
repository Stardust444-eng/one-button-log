import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { HttpError } from "../lib/http.ts";
import { DEMO_BOARD_ID, DEMO_VIEW_ID } from "../lib/ids.ts";

const dir = mkdtempSync(path.join(tmpdir(), "obl-"));
process.env.ONE_BUTTON_DB = path.join(dir, "test.sqlite");

const {
  addButton,
  createBoard,
  logTap,
  readBoard,
  removeButton,
  removeTap,
  resetDemo,
  updateButton,
  updateTap,
} = await import("../lib/store.ts");

test("the demo board is labeled sample data with a real countdown", () => {
  const { board } = readBoard(DEMO_BOARD_ID);
  assert.equal(board.name, "Maple House");
  assert.equal(board.demo, true);
  assert.equal(board.role, "edit");
  assert.equal(board.viewId, DEMO_VIEW_ID);

  const fed = board.buttons.find((button) => button.id === "demo-fed");
  assert.ok(fed);
  assert.equal(fed.taps[0]?.by, "Mom");
  const age = Date.now() - Date.parse(fed.taps[0].at);
  assert.ok(Math.abs(age - (2 * 60 + 14) * 60_000) < 2_000);

  const walk = board.buttons.find((button) => button.id === "demo-walk");
  assert.equal(walk?.taps[0]?.by, "Sam");

  const meds = board.buttons.find((button) => button.id === "demo-meds");
  assert.equal(meds?.taps[0]?.by, "Dad");
  assert.equal(meds?.intervalHours, 12);
});

test("a view-only link can read and cannot log or reveal the household id", () => {
  const { board } = readBoard(DEMO_VIEW_ID);
  assert.equal(board.role, "view");
  assert.equal(board.viewId, null);
  assert.equal(JSON.stringify(board).includes(DEMO_BOARD_ID), false);
  assert.throws(
    () => logTap(DEMO_VIEW_ID, "demo-walk", "Mom"),
    (error: unknown) => error instanceof HttpError && error.status === 403,
  );
});

test("a household can create a board, log, edit, and remove", () => {
  const created = createBoard("Test House", "diaper");
  assert.notEqual(created.id, created.viewId);
  const first = readBoard(created.id).board;
  assert.equal(first.buttons.map((button) => button.label).join(","), "Wet,Dirty,Both");

  const wet = first.buttons[0];
  const logged = logTap(created.id, wet.id, "Alex");
  assert.equal(logged.board.buttons[0]?.taps[0]?.by, "Alex");

  const updated = updateTap(
    created.id,
    logged.tapId,
    "Sam",
    new Date(Date.now() - 60_000).toISOString(),
  );
  assert.equal(updated.board.buttons[0]?.taps[0]?.by, "Sam");

  const removed = removeTap(created.id, logged.tapId);
  assert.equal(removed.board.buttons[0]?.taps.length, 0);

  const added = addButton(created.id, "Night check", 2);
  const night = added.board.buttons.at(-1);
  assert.equal(night?.label, "Night check");
  assert.equal(night?.intervalHours, 2);

  const renamed = updateButton(created.id, night!.id, "Late check", null);
  const late = renamed.board.buttons.at(-1);
  assert.equal(late?.label, "Late check");
  assert.equal(late?.intervalHours, null);

  const gone = removeButton(created.id, night!.id);
  assert.equal(
    gone.board.buttons.some((button) => button.id === night!.id),
    false,
  );
});

test("custom starts empty, and the demo can be restored", () => {
  const custom = createBoard("Blank", "custom");
  assert.equal(readBoard(custom.id).board.buttons.length, 0);

  logTap(DEMO_BOARD_ID, "demo-walk", "Alex");
  assert.equal(
    readBoard(DEMO_BOARD_ID).board.buttons.find((button) => button.id === "demo-walk")?.taps[0]?.by,
    "Alex",
  );

  const restored = resetDemo(DEMO_BOARD_ID);
  assert.equal(
    restored.board.buttons.find((button) => button.id === "demo-walk")?.taps[0]?.by,
    "Sam",
  );
  const age = Date.now() - Date.parse(restored.board.buttons[0].taps[0].at);
  assert.ok(Math.abs(age - (2 * 60 + 14) * 60_000) < 2_000);
});

test("bad ids fail clearly", () => {
  assert.throws(
    () => createBoard("Nope", "not-a-template"),
    (error: unknown) => error instanceof HttpError && error.status === 400,
  );
  assert.throws(
    () => readBoard("missing-board"),
    (error: unknown) => error instanceof HttpError && error.status === 404,
  );
});
