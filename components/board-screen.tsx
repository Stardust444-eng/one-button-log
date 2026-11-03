"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { bigOutline, bigPrimary, fieldClass } from "@/components/classes";
import { ErrorState, LoadingState, MissingState } from "@/components/states";
import { useBoard } from "@/components/use-board";
import { useNow } from "@/components/use-now";
import { useStoredWho } from "@/components/use-who";
import { WhoScreen } from "@/components/who-screen";
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
import { formatAgo, formatGiveAgain, intervalState } from "@/lib/time";
import type { PublicBoard, PublicButton } from "@/lib/types";
import { writeWho } from "@/lib/who";

type ToastState = { message: string; undoTapId?: string; undoLabel?: string } | null;

export function BoardScreen({ id }: { id: string }) {
  const now = useNow();
  const storedWho = useStoredWho();
  const who = storedWho.name;
  const { board, setBoard, loading, error, stale, reload, run } = useBoard(id);
  const [changingWho, setChangingWho] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!storedWho.ready || (loading && !board)) return <LoadingState />;
  if (error?.kind === "missing") return <MissingState />;
  if (error?.kind === "other" && !board) {
    return <ErrorState message={error.message} onRetry={reload} />;
  }
  if (!board) return <LoadingState />;

  const canLog = board.role === "edit";
  if (canLog && (!who || changingWho)) {
    return (
      <WhoScreen
        boardName={board.name}
        onCancel={who ? () => setChangingWho(false) : undefined}
        onSave={(name) => {
          writeWho(name);
          setChangingWho(false);
        }}
      />
    );
  }

  async function log(button: PublicButton) {
    if (!who) {
      setChangingWho(true);
      return;
    }
    const latest = button.taps[0];
    const early =
      now != null &&
      intervalState(latest ? Date.parse(latest.at) : null, button.intervalHours, now).kind ===
        "waiting";
    const optimisticAt = new Date().toISOString();
    setBoard((current) =>
      current
        ? {
            ...current,
            buttons: current.buttons.map((item) =>
              item.id === button.id
                ? {
                    ...item,
                    taps: [{ id: `tmp-${optimisticAt}`, by: who, at: optimisticAt }, ...item.taps],
                  }
                : item,
            ),
          }
        : current,
    );
    try {
      const data = await run(
        () =>
          api<{ board: PublicBoard; tapId: string }>(`/api/boards/${encodeURIComponent(id)}/taps`, {
            method: "POST",
            body: JSON.stringify({ buttonId: button.id, by: who }),
          }),
        (result) => setBoard(result.board),
      );
      setToast({
        message: early ? `Logged ${button.label} early` : `Logged ${button.label}`,
        undoTapId: data.tapId,
        undoLabel: button.label,
      });
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : "The tap didn't save.",
      });
      reload();
    }
  }

  async function undo(tapId: string, label: string) {
    setToast(null);
    setBoard((current) =>
      current
        ? {
            ...current,
            buttons: current.buttons.map((item) => ({
              ...item,
              taps: item.taps.filter((tap) => tap.id !== tapId),
            })),
          }
        : current,
    );
    try {
      await run(
        () =>
          api<{ board: PublicBoard }>(
            `/api/boards/${encodeURIComponent(id)}/taps/${encodeURIComponent(tapId)}`,
            { method: "DELETE" },
          ),
        (result) => setBoard(result.board),
      );
      setToast({ message: `Removed the last tap on ${label}` });
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : "Couldn't undo that tap.",
      });
      reload();
    }
  }

  return (
    <main className="flex flex-1 flex-col">
      <header>
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary">
            One-Button Log
          </Link>
          <Link
            href={`/b/${id}/share`}
            className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-primary"
          >
            Share
          </Link>
        </div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <h1 className="font-display text-4xl leading-none tracking-tight">{board.name}</h1>
          {board.demo ? (
            <span className="mb-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold tracking-wide text-secondary-foreground uppercase">
              Demo
            </span>
          ) : null}
        </div>
        {canLog && who ? (
          <button
            type="button"
            className="mt-3 inline-flex min-h-11 items-center text-base"
            onClick={() => setChangingWho(true)}
          >
            You · <span className="ml-1 font-semibold">{who}</span>
          </button>
        ) : (
          <p className="mt-3 text-base font-semibold text-due-foreground">
            View only. You can see this board, and you can’t log taps.
          </p>
        )}
        {board.demo ? (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Sample household. These names and taps are made up.
          </p>
        ) : null}
        {stale ? (
          <p className="mt-2 text-sm text-due-foreground">
            The latest taps aren’t loading. We’ll keep trying.
          </p>
        ) : null}
      </header>

      {board.buttons.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border px-5 py-10 text-center">
          <h2 className="font-display text-3xl">No buttons yet</h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Add the first thing your household wants to log.
          </p>
          {canLog ? (
            <button type="button" className={`${bigPrimary} mt-5`} onClick={() => setAdding(true)}>
              Add a button
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {board.buttons.map((button) => (
            <li key={button.id}>
              <LogCard
                boardId={id}
                button={button}
                now={now}
                canLog={canLog}
                onLog={() => void log(button)}
                onUndo={() => {
                  const latest = button.taps.find((tap) => !tap.id.startsWith("tmp-"));
                  if (!latest) {
                    setToast({ message: "Nothing to undo yet" });
                    return;
                  }
                  void undo(latest.id, button.label);
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {board.buttons.length > 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {canLog
            ? "Tap to log. Hold a button to undo the last tap."
            : "This is the view-only link. Ask the household for the logging link if you need to tap."}
        </p>
      ) : null}

      {canLog && board.buttons.length > 0 ? (
        <button type="button" className={`${bigOutline} mt-4`} onClick={() => setAdding(true)}>
          Add a button
        </button>
      ) : null}

      {canLog && board.demo ? (
        <button
          type="button"
          className="mt-3 inline-flex min-h-11 items-center self-start text-sm font-semibold text-muted-foreground"
          onClick={() => setResetting(true)}
        >
          Reset demo taps
        </button>
      ) : null}

      <AddButtonDialog
        open={adding}
        onOpenChange={setAdding}
        onCreate={async (label, intervalHours) => {
          await run(
            () =>
              api<{ board: PublicBoard }>(`/api/boards/${encodeURIComponent(id)}/buttons`, {
                method: "POST",
                body: JSON.stringify({ label, intervalHours }),
              }),
            (result) => setBoard(result.board),
          );
          setAdding(false);
        }}
      />

      <Dialog open={resetting} onOpenChange={setResetting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Reset the sample taps?</DialogTitle>
            <DialogDescription>
              Maple House goes back to the made-up demo. Taps you added on this board are removed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button
              type="button"
              className={bigPrimary}
              onClick={() => {
                void run(
                  () =>
                    api<{ board: PublicBoard }>(`/api/boards/${encodeURIComponent(id)}/reset`, {
                      method: "POST",
                    }),
                  (result) => setBoard(result.board),
                )
                  .then(() => {
                    setResetting(false);
                    setToast({ message: "Demo taps restored" });
                  })
                  .catch((err: unknown) => {
                    setToast({
                      message: err instanceof ApiError ? err.message : "Couldn't reset the demo.",
                    });
                  });
              }}
            >
              Reset demo
            </Button>
            <Button type="button" variant="ghost" className={bigOutline} onClick={() => setResetting(false)}>
              Keep the taps
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ToastBar
        toast={toast}
        onDismiss={() => setToast(null)}
        onUndo={
          toast?.undoTapId && toast.undoLabel
            ? () => void undo(toast.undoTapId as string, toast.undoLabel as string)
            : undefined
        }
      />
    </main>
  );
}

function LogCard({
  boardId,
  button,
  now,
  canLog,
  onLog,
  onUndo,
}: {
  boardId: string;
  button: PublicButton;
  now: number | null;
  canLog: boolean;
  onLog: () => void;
  onUndo: () => void;
}) {
  const latest = button.taps[0];
  const ago = !latest
    ? "No taps yet"
    : now == null
      ? `… · ${latest.by}`
      : `${formatAgo(Date.parse(latest.at), now)} · ${latest.by}`;
  const status =
    now == null || !latest
      ? null
      : intervalState(Date.parse(latest.at), button.intervalHours, now);

  const body = (
    <>
      <span className="block font-display text-[1.85rem] leading-none tracking-tight">
        {button.label}
      </span>
      <span className="mt-3 block text-lg font-semibold tracking-tight">{ago}</span>
      {status?.kind === "waiting" ? (
        <span className="mt-3 block rounded-2xl bg-ok px-3 py-2 text-[15px] leading-snug text-ok-foreground">
          <span className="block font-semibold">{formatGiveAgain(status.atLabel)}</span>
          <span className="block">{status.inLabel}</span>
        </span>
      ) : null}
      {status?.kind === "ok" ? (
        <span className="mt-3 block rounded-2xl bg-ok px-3 py-2 text-[15px] font-semibold text-ok-foreground">
          OK now
        </span>
      ) : null}
      {status?.kind === "due" ? (
        <span className="mt-3 block rounded-2xl bg-due px-3 py-2 text-[15px] font-semibold text-due-foreground">
          Due
        </span>
      ) : null}
    </>
  );

  return (
    <article className="rounded-3xl bg-card shadow-[0_16px_40px_-28px_rgba(36,49,43,0.7)] ring-1 ring-foreground/10">
      {canLog ? (
        <HoldButton label={`${button.label}. ${ago}`} onTap={onLog} onHold={onUndo}>
          {body}
        </HoldButton>
      ) : (
        <div className="px-5 pt-5 pb-3">{body}</div>
      )}
      <div className="flex justify-end px-2 pb-1">
        <Link
          href={`/b/${boardId}/history/${button.id}`}
          className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-primary"
        >
          History
        </Link>
      </div>
    </article>
  );
}

function HoldButton({
  label,
  onTap,
  onHold,
  children,
}: {
  label: string;
  onTap: () => void;
  onHold: () => void;
  children: React.ReactNode;
}) {
  const timer = useRef<number | null>(null);
  const held = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const [holding, setHolding] = useState(false);

  function clearTimer() {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    setHolding(false);
  }

  return (
    <button
      type="button"
      aria-label={label}
      data-holding={holding ? "true" : "false"}
      className="w-full rounded-3xl px-5 pt-5 pb-3 text-left select-none data-[holding=true]:bg-secondary"
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        held.current = false;
        start.current = { x: event.clientX, y: event.clientY };
        clearTimer();
        setHolding(true);
        timer.current = window.setTimeout(() => {
          timer.current = null;
          held.current = true;
          setHolding(false);
          navigator.vibrate?.(12);
          onHold();
        }, 650);
      }}
      onPointerMove={(event) => {
        if (timer.current == null) return;
        const dx = Math.abs(event.clientX - start.current.x);
        const dy = Math.abs(event.clientY - start.current.y);
        if (dx > 12 || dy > 12) clearTimer();
      }}
      onPointerUp={clearTimer}
      onPointerCancel={clearTimer}
      onPointerLeave={clearTimer}
      onClick={(event) => {
        if (held.current) {
          held.current = false;
          event.preventDefault();
          return;
        }
        onTap();
      }}
    >
      {children}
    </button>
  );
}

function AddButtonDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (label: string, intervalHours: number | null) => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [wait, setWait] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function close(next: boolean) {
    if (!next) {
      setLabel("");
      setWait("");
      setError(null);
      setSaving(false);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add a button</DialogTitle>
          <DialogDescription>
            One short name. Add a wait if this is a dose or a meal that shouldn’t happen twice.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const next = label.trim().replace(/\s+/g, " ");
            if (!next) {
              setError("Name the button.");
              return;
            }
            const intervalHours = wait.trim() === "" ? null : Number(wait);
            if (intervalHours != null && (!Number.isFinite(intervalHours) || intervalHours < 0)) {
              setError("Wait time needs to be a number of hours.");
              return;
            }
            setSaving(true);
            setError(null);
            void onCreate(next, intervalHours)
              .then(() => {
                setLabel("");
                setWait("");
                setSaving(false);
              })
              .catch((err: unknown) => {
                setError(err instanceof ApiError ? err.message : "Couldn't add that button.");
                setSaving(false);
              });
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="button-label">Name</Label>
            <Input
              id="button-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Night feed"
              maxLength={40}
              autoComplete="off"
              className={fieldClass}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="button-wait">Minimum wait, in hours</Label>
            <Input
              id="button-wait"
              value={wait}
              onChange={(event) => setWait(event.target.value)}
              inputMode="decimal"
              placeholder="Optional"
              className={fieldClass}
            />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Leave this blank if a tap is always fine.
            </p>
          </div>
          {error ? (
            <p role="alert" className="text-sm font-semibold text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" className={bigPrimary} disabled={saving}>
            {saving ? "Adding…" : "Add button"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ToastBar({
  toast,
  onUndo,
  onDismiss,
}: {
  toast: ToastState;
  onUndo?: () => void;
  onDismiss: () => void;
}) {
  if (!toast) return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-full max-w-md px-4">
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-between gap-3 rounded-2xl bg-foreground px-4 py-3 text-background shadow-lg"
      >
        <p className="text-sm font-semibold">{toast.message}</p>
        <div className="flex shrink-0 items-center">
          {onUndo ? (
            <button type="button" className="min-h-11 px-3 text-sm font-bold underline" onClick={onUndo}>
              Undo
            </button>
          ) : null}
          <button type="button" className="min-h-11 px-2 text-sm" onClick={onDismiss}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
