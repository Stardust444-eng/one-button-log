"use client";

import { bigPrimary } from "@/components/classes";

export default function ErrorScreen({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col">
      <p className="text-sm font-semibold text-primary">One-Button Log</p>
      <h1 className="mt-4 font-display text-4xl leading-tight">Something went wrong</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
        The board hit a snag. Taps already saved on this computer are still there.
      </p>
      <button type="button" className={`${bigPrimary} mt-8`} onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
