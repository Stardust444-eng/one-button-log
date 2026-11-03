"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api } from "@/lib/client-api";
import type { PublicBoard } from "@/lib/types";

type LoadError = { kind: "missing" } | { kind: "other"; message: string } | null;

export function useBoard(id: string, paused = false) {
  const [board, setBoard] = useState<PublicBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<LoadError>(null);
  const [stale, setStale] = useState(false);
  const [nonce, setNonce] = useState(0);
  const inflight = useRef(0);
  const pausedRef = useRef(paused);
  const boardRef = useRef(board);

  useEffect(() => {
    pausedRef.current = paused;
    boardRef.current = board;
  });

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const data = await api<{ board: PublicBoard }>(`/api/boards/${encodeURIComponent(id)}`);
        if (ignore) return;
        setBoard(data.board);
        setError(null);
        setStale(false);
        setLoading(false);
        if (typeof document !== "undefined") {
          document.title = data.board.demo
            ? `${data.board.name} demo · One-Button Log`
            : `${data.board.name} · One-Button Log`;
        }
      } catch (err) {
        if (ignore) return;
        setLoading(false);
        if (err instanceof ApiError && err.status === 404) {
          setError({ kind: "missing" });
        } else {
          setError({
            kind: "other",
            message: err instanceof ApiError ? err.message : "Can't reach the board.",
          });
        }
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [id, nonce]);

  useEffect(() => {
    let ignore = false;

    async function refresh() {
      if (inflight.current > 0 || pausedRef.current || document.hidden) return;
      try {
        const data = await api<{ board: PublicBoard }>(`/api/boards/${encodeURIComponent(id)}`);
        if (ignore || inflight.current > 0 || pausedRef.current) return;
        setBoard(data.board);
        setStale(false);
      } catch {
        if (!ignore && boardRef.current) setStale(true);
      }
    }

    const timer = window.setInterval(() => void refresh(), 4000);
    const onVisible = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      ignore = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [id]);

  const run = useCallback(async function run<T>(fn: () => Promise<T>, apply: (data: T) => void) {
    inflight.current += 1;
    try {
      const data = await fn();
      if (inflight.current === 1) apply(data);
      return data;
    } finally {
      inflight.current -= 1;
    }
  }, []);

  return { board, setBoard, loading, error, stale, reload, run };
}
