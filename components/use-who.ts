"use client";

import { useEffect, useState } from "react";
import { readWho } from "@/lib/who";

export function useStoredWho(): { ready: boolean; name: string | null } {
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readWho();
    const onChange = () => setName(readWho());
    queueMicrotask(() => {
      setName(stored);
      setReady(true);
    });
    window.addEventListener("one-button-who", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("one-button-who", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return { ready, name };
}
