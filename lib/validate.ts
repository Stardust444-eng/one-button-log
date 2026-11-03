import { HttpError } from "./http";

export function cleanText(input: unknown, emptyMessage: string, max: number): string {
  if (typeof input !== "string") throw new HttpError(400, emptyMessage);
  const value = input.trim().replace(/\s+/g, " ");
  if (!value) throw new HttpError(400, emptyMessage);
  if (value.length > max) {
    throw new HttpError(400, `Keep it under ${max} characters.`);
  }
  return value;
}

export function cleanInterval(input: unknown): number | null {
  if (input == null || input === "") return null;
  const value = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(value) || value < 0) {
    throw new HttpError(400, "Wait time needs to be a number of hours.");
  }
  if (value === 0) return null;
  if (value < 0.25) {
    throw new HttpError(400, "Wait time needs to be at least 15 minutes.");
  }
  if (value > 24 * 90) {
    throw new HttpError(400, "Wait time needs to be under 90 days.");
  }
  return Math.round(value * 100) / 100;
}

export function cleanWhen(input: unknown): string {
  if (typeof input !== "string") {
    throw new HttpError(400, "That time isn't valid.");
  }
  const ms = Date.parse(input);
  if (!Number.isFinite(ms)) throw new HttpError(400, "That time isn't valid.");
  if (ms > Date.now() + 60_000) {
    throw new HttpError(400, "A tap can't be in the future.");
  }
  if (ms < Date.UTC(2000, 0, 1)) {
    throw new HttpError(400, "That time is too far in the past.");
  }
  return new Date(ms).toISOString();
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const body = (await request.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Send a JSON body.");
  }
  return body as Record<string, unknown>;
}
