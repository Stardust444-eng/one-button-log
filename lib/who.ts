const KEY = "one-button-log.who";

export function readWho(): string | null {
  try {
    const value = localStorage.getItem(KEY)?.trim() ?? "";
    return value || null;
  } catch {
    return null;
  }
}

export function writeWho(name: string) {
  localStorage.setItem(KEY, name);
  window.dispatchEvent(new Event("one-button-who"));
}
