"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { bigOutline, fieldClass } from "@/components/classes";
import { QrBlock } from "@/components/qr-block";
import { ErrorState, LoadingState, MissingState } from "@/components/states";
import { useBoard } from "@/components/use-board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ShareScreen({ id }: { id: string }) {
  const { board, loading, error, reload } = useBoard(id);
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );

  if (loading && !board) return <LoadingState label="Opening the share page…" />;
  if (error?.kind === "missing") return <MissingState />;
  if (error?.kind === "other" && !board) return <ErrorState message={error.message} onRetry={reload} />;
  if (!board || !origin) return <LoadingState label="Opening the share page…" />;

  const here = `${origin}/b/${id}`;
  const canLog = board.role === "edit" && board.viewId;
  const viewUrl = canLog ? `${origin}/b/${board.viewId}` : here;

  return (
    <main className="flex flex-1 flex-col">
      <Link
        href={`/b/${id}`}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary"
      >
        ← {board.name}
      </Link>
      <h1 className="mt-3 font-display text-4xl leading-none tracking-tight">Share {board.name}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
        {canLog
          ? "Anyone with the household link can log a tap. The view-only link is for a sitter or the vet."
          : "This is the view-only link. People with it can look, not log."}
      </p>

      {canLog ? (
        <LinkBlock
          title="Household link"
          detail="Put this QR on the fridge. Anyone who scans it can log."
          url={here}
          qrLabel={`QR code for the ${board.name} household link`}
        />
      ) : null}

      <LinkBlock
        title={canLog ? "View-only link" : "This link"}
        detail={
          canLog
            ? "A sitter can see the last tap and the countdown, and can't change them."
            : "Ask the household for the logging link if you need to tap."
        }
        url={viewUrl}
        qrLabel={`QR code for the ${board.name} view-only link`}
      />

      <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
        On a phone, use the browser menu and choose Add to Home Screen. It opens like an app, with
        no store and no account.
      </p>
    </main>
  );
}

function LinkBlock({
  title,
  detail,
  url,
  qrLabel,
}: {
  title: string;
  detail: string;
  url: string;
  qrLabel: string;
}) {
  const [status, setStatus] = useState<string | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Copied");
    } catch {
      setStatus("Select the link and copy it");
    }
    window.setTimeout(() => setStatus(null), 2500);
  }

  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{detail}</p>
      <div className="mt-3 grid gap-2">
        <Label htmlFor={title} className="sr-only">
          {title}
        </Label>
        <Input
          id={title}
          readOnly
          value={url}
          className={fieldClass}
          onFocus={(event) => event.currentTarget.select()}
        />
        <Button type="button" variant="outline" className={bigOutline} onClick={() => void copy()}>
          {status ?? "Copy link"}
        </Button>
      </div>
      <div className="mt-4">
        <QrBlock value={url} label={qrLabel} />
      </div>
    </section>
  );
}
