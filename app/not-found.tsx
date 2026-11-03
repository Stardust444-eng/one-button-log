import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col">
      <p className="text-sm font-semibold text-primary">One-Button Log</p>
      <h1 className="mt-4 font-display text-4xl leading-tight">That page isn’t here</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
        The link may have been typed wrong.
      </p>
      <Link href="/" className="mt-8 inline-flex min-h-12 items-center font-semibold text-primary">
        Back to the start
      </Link>
    </main>
  );
}
