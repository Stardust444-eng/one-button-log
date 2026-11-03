"use client";

import Link from "next/link";
import { bigPrimary } from "@/components/classes";

export function LoadingState({ label = "Opening the board…" }: { label?: string }) {
  return (
    <main aria-busy="true" className="flex flex-1 flex-col">
      <p className="text-sm font-semibold text-primary">One-Button Log</p>
      <p className="mt-6 text-lg">{label}</p>
      <div className="mt-6 space-y-3">
        <div className="h-32 animate-pulse rounded-3xl bg-muted" />
        <div className="h-32 animate-pulse rounded-3xl bg-muted" />
        <div className="h-32 animate-pulse rounded-3xl bg-muted" />
      </div>
    </main>
  );
}

export function MissingState() {
  return (
    <main className="flex flex-1 flex-col">
      <p className="text-sm font-semibold text-primary">One-Button Log</p>
      <h1 className="mt-4 font-display text-4xl leading-tight">This link doesn’t match a board</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
        It may have been copied wrong. Ask the household for a fresh link.
      </p>
      <Link href="/" className={`${bigPrimary} mt-8`}>
        Go to the start
      </Link>
    </main>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="flex flex-1 flex-col">
      <p className="text-sm font-semibold text-primary">One-Button Log</p>
      <h1 className="mt-4 font-display text-4xl leading-tight">The board didn’t load</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{message}</p>
      <button type="button" className={`${bigPrimary} mt-8`} onClick={onRetry}>
        Try again
      </button>
    </main>
  );
}
