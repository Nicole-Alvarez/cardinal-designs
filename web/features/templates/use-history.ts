"use client";

import { useCallback, useRef, useState } from "react";
import type { TemplateBlock, TemplateCanvas, TemplateMetadata } from "./types";

export interface TemplateSnapshot {
  blocks: TemplateBlock[];
  canvas: TemplateCanvas;
  title: string;
  metadata: TemplateMetadata;
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
export function useTemplateHistory() {
  const past = useRef<TemplateSnapshot[]>([]);
  const future = useRef<TemplateSnapshot[]>([]);
  const lastTag = useRef<CoalesceState | null>(null);
  const currentRef = useRef<TemplateSnapshot | null>(null);
  const [depths, setDepths] = useState({ past: 0, future: 0 });

  /** Keeps the hook's view of "now"; call on every render. */
  const setCurrent = useCallback((snapshot: TemplateSnapshot) => {
    currentRef.current = snapshot;
  }, []);

  const sync = useCallback(() => {
    setDepths({ past: past.current.length, future: future.current.length });
  }, []);

  const checkpoint = useCallback(
    (snapshot: TemplateSnapshot, tag: string) => {
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

  const undo = useCallback((): TemplateSnapshot | null => {
    const previous = past.current.pop();
    if (!previous || !currentRef.current) return null;
    future.current.push(currentRef.current);
    lastTag.current = null;
    sync();
    return previous;
  }, [sync]);

  const redo = useCallback((): TemplateSnapshot | null => {
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
