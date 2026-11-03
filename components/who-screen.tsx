"use client";

import { useState } from "react";
import { bigGhost, bigOutline, bigPrimary, fieldClass } from "@/components/classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const suggestions = ["Mom", "Dad", "Alex", "Sam"];

export function WhoScreen({
  boardName,
  onSave,
  onCancel,
}: {
  boardName: string;
  onSave: (name: string) => void;
  onCancel?: () => void;
}) {
  const [custom, setCustom] = useState("");
  const trimmed = custom.trim().replace(/\s+/g, " ");

  return (
    <main className="flex flex-1 flex-col">
      <p className="text-sm font-semibold text-primary">One-Button Log</p>
      <h1 className="mt-4 font-display text-4xl leading-tight">Who are you?</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
        On {boardName}, your name shows next to each tap so the rest of the house knows it was you.
        It stays on this device. There is no account.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {suggestions.map((name) => (
          <button key={name} type="button" className={bigOutline} onClick={() => onSave(name)}>
            {name}
          </button>
        ))}
      </div>
      <form
        className="mt-6 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (trimmed) onSave(trimmed.slice(0, 24));
        }}
      >
        <Label htmlFor="custom-name">Or type a name</Label>
        <Input
          id="custom-name"
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          placeholder="Jordan"
          maxLength={24}
          autoComplete="off"
          className={fieldClass}
        />
        <Button type="submit" className={bigPrimary} disabled={!trimmed}>
          That’s me
        </Button>
      </form>
      {onCancel ? (
        <Button type="button" variant="ghost" className={`${bigGhost} mt-2`} onClick={onCancel}>
          Cancel
        </Button>
      ) : null}
    </main>
  );
}
