"use client";

import { useCallback, useRef, useState } from "react";
import type { CodeLang, TemplateBlock, TemplateCanvas } from "./types";

export interface TemplateSnapshot {
  blocks: TemplateBlock[];
  canvas: TemplateCanvas;
  title: string;
  description: string;
}

export interface CodeSnapshot {
  codeBuffers: Record<CodeLang, string>;
  title: string;
  description: string;
}

const MAX_HISTORY = 50;
const COALESCE_MS = 800;

interface CoalesceState {
  tag: string;
  at: number;
}

/**
 * Snapshot-based undo/redo. checkpoint() is called with the CURRENT state
 * BEFORE a mutation; consecutive checkpoints sharing a tag within
 * COALESCE_MS collapse into one entry so drags and typing undo as steps.
 */
function useSnapshotHistory<T>() {
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const lastTag = useRef<CoalesceState | null>(null);
  const currentRef = useRef<T | null>(null);
  const [depths, setDepths] = useState({ past: 0, future: 0 });

  /** Keeps the hook's view of "now"; call on every render. */
  const setCurrent = useCallback((snapshot: T) => {
    currentRef.current = snapshot;
  }, []);

  const sync = useCallback(() => {
    setDepths({ past: past.current.length, future: future.current.length });
  }, []);

  const checkpoint = useCallback(
    (snapshot: T, tag: string) => {
      const now = Date.now();
      const coalesce =
        lastTag.current !== null &&
        lastTag.current.tag === tag &&
        now - lastTag.current.at < COALESCE_MS;

      if (!coalesce) {
        past.current.push(snapshot);
        if (past.current.length > MAX_HISTORY) past.current.shift();
      }
      lastTag.current = { tag, at: now };
      future.current = [];
      sync();
    },
    [sync]
  );

  const undo = useCallback((): T | null => {
    const previous = past.current.pop();
    if (!previous || !currentRef.current) return null;
    future.current.push(currentRef.current);
    lastTag.current = null;
    sync();
    return previous;
  }, [sync]);

  const redo = useCallback((): T | null => {
    const next = future.current.pop();
    if (!next || !currentRef.current) return null;
    past.current.push(currentRef.current);
    lastTag.current = null;
    sync();
    return next;
  }, [sync]);

  return {
    setCurrent,
    checkpoint,
    undo,
    redo,
    canUndo: depths.past > 0,
    canRedo: depths.future > 0,
  };
}

export function useTemplateHistory() {
  return useSnapshotHistory<TemplateSnapshot>();
}

export function useCodeHistory() {
  return useSnapshotHistory<CodeSnapshot>();
}
