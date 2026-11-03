"use client";

import Link from "next/link";
import { bigOutline, bigPrimary } from "@/components/classes";
import { DEMO_BOARD_ID } from "@/lib/ids";

export function Landing() {
  return (
    <main className="flex flex-1 flex-col">
      <p className="text-sm font-semibold text-primary">One-Button Log</p>
      <h1 className="mt-4 font-display text-[2.7rem] leading-[1.05] tracking-tight text-balance">
        Did anyone already do it?
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        Big buttons for a household. One tap logs “I just did this.” Everyone with the link sees
        who, and how long ago.
      </p>
      <p className="mt-5 text-sm font-semibold tracking-wide text-foreground">
        No account. No install. No ads.
      </p>
      <div className="mt-8 grid gap-3">
        <Link href="/new" className={bigPrimary}>
          Create a board
        </Link>
        <Link href={`/b/${DEMO_BOARD_ID}`} className={bigOutline}>
          Try the demo board
        </Link>
      </div>
      <p className="mt-auto pt-12 text-sm leading-relaxed text-muted-foreground">
        Maple House on the demo is made-up sample data, not a real family.
      </p>
    </main>
  );
}
