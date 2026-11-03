const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export type IntervalState =
  | { kind: "none" }
  | { kind: "waiting"; atLabel: string; inLabel: string }
  | { kind: "ok" }
  | { kind: "due" };

export function formatAgo(fromMs: number, nowMs: number): string {
  const delta = Math.max(0, nowMs - fromMs);
  if (delta < MINUTE) return "just now";
  const minutes = Math.floor(delta / MINUTE);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  if (hours < 24) {
    return remMin === 0 ? `${hours}h ago` : `${hours}h ${remMin}m ago`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  if (days < 14) {
    return remHours === 0 ? `${days}d ago` : `${days}d ${remHours}h ago`;
  }
  return new Date(fromMs).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatIn(deltaMs: number): string {
  if (deltaMs < MINUTE) return "in under a minute";
  const roundedMin = Math.max(1, Math.round(deltaMs / MINUTE));
  if (roundedMin < 60) return `in ${roundedMin}m`;
  const hours = Math.floor(roundedMin / 60);
  const rem = roundedMin % 60;
  if (hours < 48) return rem === 0 ? `in ${hours}h` : `in ${hours}h ${rem}m`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours === 0 ? `in ${days}d` : `in ${days}d ${remHours}h`;
}

export function formatClock(dateMs: number, nowMs: number): string {
  const date = new Date(dateMs);
  const now = new Date(nowMs);
  const time = date
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace("AM", "am")
    .replace("PM", "pm");
  const start = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const dayDiff = Math.round((start(date) - start(now)) / DAY);
  if (dayDiff === 0) return time;
  if (dayDiff === 1) return `tomorrow ${time}`;
  if (dayDiff === -1) return `yesterday ${time}`;
  if (dayDiff > 1 && dayDiff < 7) {
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    return `${weekday} ${time}`;
  }
  const monthDay = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${monthDay}, ${time}`;
}

export function formatGiveAgain(atLabel: string): string {
  if (atLabel.startsWith("tomorrow ")) {
    return `OK to give again tomorrow at ${atLabel.slice("tomorrow ".length)}`;
  }
  const weekday = atLabel.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat) (.+)$/);
  if (weekday) return `OK to give again ${weekday[1]} at ${weekday[2]}`;
  if (atLabel.includes(", ")) {
    const [day, time] = atLabel.split(", ");
    return `OK to give again ${day} at ${time}`;
  }
  return `OK to give again at ${atLabel}`;
}

export function formatTapTime(dateMs: number): string {
  return new Date(dateMs)
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace("AM", "am")
    .replace("PM", "pm");
}

export function dayHeading(dateMs: number, nowMs: number): string {
  const date = new Date(dateMs);
  const now = new Date(nowMs);
  const start = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const dayDiff = Math.round((start(date) - start(now)) / DAY);
  if (dayDiff === 0) return "Today";
  if (dayDiff === -1) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function intervalState(
  lastAtMs: number | null,
  intervalHours: number | null,
  nowMs: number,
): IntervalState {
  if (intervalHours == null || intervalHours <= 0 || lastAtMs == null) {
    return { kind: "none" };
  }
  const intervalMs = intervalHours * HOUR;
  const next = lastAtMs + intervalMs;
  if (nowMs < next) {
    return {
      kind: "waiting",
      atLabel: formatClock(next, nowMs),
      inLabel: formatIn(next - nowMs),
    };
  }
  const overdue = nowMs - next;
  if (overdue <= intervalMs * 0.25) return { kind: "ok" };
  return { kind: "due" };
}

export function formatRhythm(timesMs: number[]): string | null {
  if (timesMs.length < 2) return null;
  const sorted = [...timesMs].sort((a, b) => a - b);
  let total = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    total += sorted[i] - sorted[i - 1];
  }
  return `About every ${formatDuration(total / (sorted.length - 1))}`;
}

export function formatDuration(ms: number): string {
  const minutes = Math.round(ms / MINUTE);
  if (minutes < 90) {
    const shown = Math.max(1, minutes);
    return shown === 1 ? "1 minute" : `${shown} minutes`;
  }
  const hours = ms / HOUR;
  if (hours < 36) {
    const rounded = Math.max(1, Math.round(hours));
    return rounded === 1 ? "1 hour" : `${rounded} hours`;
  }
  const days = Math.round((ms / DAY) * 10) / 10;
  if (days === 1) return "1 day";
  const shown = Number.isInteger(days) ? String(days) : days.toFixed(1);
  return `${shown} days`;
}

export function formatWait(hours: number): string {
  return formatDuration(hours * HOUR);
}

export function toDatetimeLocalValue(ms: number): string {
  const date = new Date(ms);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
