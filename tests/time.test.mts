import assert from "node:assert/strict";
import test from "node:test";
import { formatAgo, formatGiveAgain, formatIn, formatRhythm, intervalState } from "../lib/time.ts";

const now = Date.parse("2026-11-03T18:00:00Z");

test("formats the household ago line", () => {
  assert.equal(formatAgo(now - 30_000, now), "just now");
  assert.equal(formatAgo(now - 26 * 60_000, now), "26m ago");
  assert.equal(formatAgo(now - (2 * 60 + 14) * 60_000, now), "2h 14m ago");
  assert.equal(formatAgo(now - 20 * 60 * 60_000, now), "20h ago");
});

test("countdown copy for a minimum wait", () => {
  const last = now - (2 * 60 + 14) * 60_000;
  const state = intervalState(last, 8, now);
  assert.equal(state.kind, "waiting");
  if (state.kind !== "waiting") return;
  assert.equal(state.inLabel, "in 5h 46m");
  assert.equal(formatGiveAgain("6:10 pm"), "OK to give again at 6:10 pm");
  assert.equal(formatGiveAgain("tomorrow 6:10 am"), "OK to give again tomorrow at 6:10 am");
  assert.match(formatIn(5 * 60_000), /^in 5m$/);
});

test("a dose just inside the window is ok, and a late one is due", () => {
  const justOpen = now - (12 * 60 + 5) * 60_000;
  assert.equal(intervalState(justOpen, 12, now).kind, "ok");
  const late = now - 20 * 60 * 60_000;
  assert.equal(intervalState(late, 12, now).kind, "due");
  assert.equal(intervalState(null, 8, now).kind, "none");
  assert.equal(intervalState(now, null, now).kind, "none");
});

test("estimates a rhythm from the gaps", () => {
  const taps = [0, 10, 21, 31].map((hours) => hours * 60 * 60_000);
  assert.equal(formatRhythm(taps), "About every 10 hours");
  assert.equal(formatRhythm([0]), null);
});
