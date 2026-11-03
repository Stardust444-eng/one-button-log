"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { bigOutline, bigPrimary, fieldClass } from "@/components/classes";
import { ErrorState, LoadingState, MissingState } from "@/components/states";
import { useBoard } from "@/components/use-board";
import { useNow } from "@/components/use-now";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api } from "@/lib/client-api";
import { dayHeading, formatRhythm, formatTapTime, formatWait, toDatetimeLocalValue } from "@/lib/time";
import type { PublicBoard, PublicTap } from "@/lib/types";

export function HistoryScreen({ id, buttonId }: { id: string; buttonId: string }) {
  const router = useRouter();
  const now = useNow();
  const [editing, setEditing] = useState<{ id: string; by: string; atLocal: string } | null>(null);
  const [draft, setDraft] = useState<{ id: string; label: string; wait: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [saving, setSaving] = useState(false);

  const { board, setBoard, loading, error, reload, run } = useBoard(
    id,
    editing != null || saving,
  );

  const button = board?.buttons.find((item) => item.id === buttonId);
  const serverWait = button?.intervalHours == null ? "" : String(button.intervalHours);
  const usingDraft = draft != null && button != null && draft.id === button.id;
  const label = usingDraft && draft ? draft.label : (button?.label ?? "");
  const wait = usingDraft && draft ? draft.wait : serverWait;
  const dirty = button != null && (label !== button.label || wait !== serverWait);

  if (loading && !board) return <LoadingState label="Opening the history…" />;
  if (error?.kind === "missing") return <MissingState />;
  if (error?.kind === "other" && !board) return <ErrorState message={error.message} onRetry={reload} />;
  if (!board) return <LoadingState label="Opening the history…" />;
  if (!button) {
    return (
      <main className="flex flex-1 flex-col">
        <Link href={`/b/${id}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary">
          ← {board.name}
        </Link>
        <h1 className="mt-4 font-display text-4xl leading-tight">That button isn’t on this board</h1>
        <p className="mt-3 text-lg text-muted-foreground">It may have been removed.</p>
      </main>
    );
  }

  const canEdit = board.role === "edit";
  const rhythm =
    now == null ? null : formatRhythm(button.taps.map((tap) => Date.parse(tap.at)));
  const groups = groupTaps(button.taps, now);

  async function saveTap(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const by = editing.by.trim().replace(/\s+/g, " ");
    if (!by) {
      setMessage("Add a name for this tap.");
      return;
    }
    const at = new Date(editing.atLocal).toISOString();
    const tapId = editing.id;
    setSaving(true);
    try {
      await run(
        () =>
          api<{ board: PublicBoard }>(
            `/api/boards/${encodeURIComponent(id)}/taps/${encodeURIComponent(tapId)}`,
            { method: "PATCH", body: JSON.stringify({ by, at }) },
          ),
        (result) => setBoard(result.board),
      );
      setEditing(null);
      setMessage("Tap updated");
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Couldn't update that tap.");
    } finally {
      setSaving(false);
    }
  }

  async function removeTap(tapId: string) {
    setSaving(true);
    try {
      await run(
        () =>
          api<{ board: PublicBoard }>(
            `/api/boards/${encodeURIComponent(id)}/taps/${encodeURIComponent(tapId)}`,
            { method: "DELETE" },
          ),
        (result) => setBoard(result.board),
      );
      setEditing(null);
      setMessage("Tap removed");
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Couldn't remove that tap.");
    } finally {
      setSaving(false);
    }
  }

  const saveButton = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!button) return;
    const nextLabel = label.trim().replace(/\s+/g, " ");
    if (!nextLabel) {
      setMessage("Name the button.");
      return;
    }
    const intervalHours = wait.trim() === "" ? null : Number(wait);
    setSaving(true);
    try {
      await run(
        () =>
          api<{ board: PublicBoard }>(
            `/api/boards/${encodeURIComponent(id)}/buttons/${encodeURIComponent(button.id)}`,
            {
              method: "PATCH",
              body: JSON.stringify({ label: nextLabel, intervalHours }),
            },
          ),
        (result) => setBoard(result.board),
      );
      setDraft(null);
      setMessage("Button saved");
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Couldn't save the button.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col">
      <Link
        href={`/b/${id}`}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary"
      >
        ← {board.name}
      </Link>
      <h1 className="mt-3 font-display text-4xl leading-none tracking-tight">{button.label}</h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        {button.taps.length < 2
          ? "Not enough taps yet to estimate a rhythm."
          : (rhythm ?? "Checking the rhythm…")}
      </p>
      {board.demo ? (
        <p className="mt-1 text-sm text-muted-foreground">Demo history. The people here aren’t real.</p>
      ) : null}
      {message ? (
        <p role="status" className="mt-3 text-sm font-semibold text-primary">
          {message}
        </p>
      ) : null}

      {button.taps.length === 0 ? (
        <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
          No taps yet. They show up here after the first one.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {groups.map((group) => (
            <section key={group.heading}>
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                {group.heading}
              </h2>
              <ul className="mt-1 divide-y divide-border">
                {group.taps.map((tap) => {
                  const current = editing?.id === tap.id ? editing : null;
                  const when = formatTapTime(Date.parse(tap.at));
                  return (
                    <li key={tap.id} className="py-1">
                      {current ? (
                        <form className="grid gap-3 py-3" onSubmit={(event) => void saveTap(event)}>
                          <div className="grid gap-2">
                            <Label htmlFor={`by-${tap.id}`}>Who</Label>
                            <Input
                              id={`by-${tap.id}`}
                              value={current.by}
                              onChange={(event) =>
                                setEditing({ ...current, by: event.target.value })
                              }
                              maxLength={24}
                              autoComplete="off"
                              className={fieldClass}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor={`at-${tap.id}`}>When</Label>
                            <Input
                              id={`at-${tap.id}`}
                              type="datetime-local"
                              value={current.atLocal}
                              onChange={(event) =>
                                setEditing({ ...current, atLocal: event.target.value })
                              }
                              className={fieldClass}
                            />
                          </div>
                          <Button type="submit" className={bigPrimary} disabled={saving}>
                            Save tap
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className={bigOutline}
                            disabled={saving}
                            onClick={() => void removeTap(tap.id)}
                          >
                            Remove tap
                          </Button>
                          <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                            Cancel
                          </Button>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <p className="py-3 text-base">
                            <span className="font-semibold">{when}</span>
                            <span> · {tap.by}</span>
                          </p>
                          {canEdit ? (
                            <button
                              type="button"
                              className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-primary"
                              onClick={() =>
                                setEditing({
                                  id: tap.id,
                                  by: tap.by,
                                  atLocal: toDatetimeLocalValue(Date.parse(tap.at)),
                                })
                              }
                            >
                              Edit
                            </button>
                          ) : null}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {canEdit ? (
        <form className="mt-8 grid gap-3 border-t border-border pt-6" onSubmit={(event) => void saveButton(event)}>
          <h2 className="font-display text-2xl">This button</h2>
          <div className="grid gap-2">
            <Label htmlFor="history-label">Name</Label>
            <Input
              id="history-label"
              value={label}
              onChange={(event) =>
                setDraft({ id: button.id, label: event.target.value, wait })
              }
              maxLength={40}
              autoComplete="off"
              className={fieldClass}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="history-wait">Minimum wait, in hours</Label>
            <Input
              id="history-wait"
              value={wait}
              onChange={(event) =>
                setDraft({ id: button.id, label, wait: event.target.value })
              }
              inputMode="decimal"
              placeholder="Optional"
              className={fieldClass}
            />
            <p className="text-sm leading-relaxed text-muted-foreground">
              {button.intervalHours
                ? `Waiting at least ${formatWait(button.intervalHours)} between taps. Leave blank to remove the countdown.`
                : "Leave blank if a tap is always fine. Meds and meals use this for the countdown."}
            </p>
          </div>
          <Button type="submit" className={bigPrimary} disabled={saving || !dirty}>
            Save changes
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={bigOutline}
            onClick={() => setConfirmRemove(true)}
          >
            Remove this button
          </Button>
        </form>
      ) : null}

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Remove {button.label}?</DialogTitle>
            <DialogDescription>The button and its taps are deleted for everyone with the link.</DialogDescription>
          </DialogHeader>
          <Button
            type="button"
            className={bigPrimary}
            disabled={saving}
            onClick={() => {
              setSaving(true);
              void run(
                () =>
                  api<{ board: PublicBoard }>(
                    `/api/boards/${encodeURIComponent(id)}/buttons/${encodeURIComponent(button.id)}`,
                    { method: "DELETE" },
                  ),
                (result) => setBoard(result.board),
              )
                .then(() => router.push(`/b/${id}`))
                .catch((err: unknown) => {
                  setMessage(err instanceof ApiError ? err.message : "Couldn't remove the button.");
                  setSaving(false);
                });
            }}
          >
            Remove button
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function groupTaps(taps: PublicTap[], now: number | null) {
  const groups: { heading: string; taps: PublicTap[] }[] = [];
  for (const tap of taps) {
    const heading = now == null ? "Taps" : dayHeading(Date.parse(tap.at), now);
    const last = groups[groups.length - 1];
    if (!last || last.heading !== heading) groups.push({ heading, taps: [tap] });
    else last.taps.push(tap);
  }
  return groups;
}
