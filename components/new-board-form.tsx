"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { bigPrimary, fieldClass } from "@/components/classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api } from "@/lib/client-api";
import { templates } from "@/lib/templates";

export function NewBoardForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("dog");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const selected = templates.find((template) => template.id === templateId) ?? templates[0];

  const preview =
    selected.buttons.length === 0
      ? "You'll add your own buttons next."
      : `Adds ${joinLabels(selected.buttons.map((button) => button.label))}.`;

  return (
    <main className="flex flex-1 flex-col">
      <Link href="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary">
        ← Start
      </Link>
      <h1 className="mt-3 font-display text-4xl leading-none tracking-tight">New board</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
        Name it, then pick a starting set. You can add or remove buttons later.
      </p>

      <form
        className="mt-6 grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setSaving(true);
          void api<{ id: string }>("/api/boards", {
            method: "POST",
            body: JSON.stringify({ name, templateId }),
          })
            .then((data) => router.push(`/b/${data.id}`))
            .catch((err: unknown) => {
              setError(err instanceof ApiError ? err.message : "Couldn't create the board.");
              setSaving(false);
            });
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="board-name">Name</Label>
          <Input
            id="board-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Maple House"
            maxLength={40}
            autoComplete="off"
            className={fieldClass}
          />
        </div>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Start with</legend>
          <div className="grid gap-2">
            {templates.map((template) => {
              const pressed = template.id === templateId;
              return (
                <button
                  key={template.id}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => setTemplateId(template.id)}
                  className={`min-h-16 rounded-2xl border px-4 py-3 text-left ${
                    pressed
                      ? "border-primary bg-ok ring-2 ring-primary"
                      : "border-border bg-card"
                  }`}
                >
                  <span className="block text-base font-semibold">{template.name}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
                    {template.blurb}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <p className="text-sm leading-relaxed text-muted-foreground">{preview}</p>
        {error ? (
          <p role="alert" className="text-sm font-semibold text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" className={bigPrimary} disabled={saving}>
          {saving ? "Creating the board…" : "Create board"}
        </Button>
      </form>
    </main>
  );
}

function joinLabels(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? "";
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}
