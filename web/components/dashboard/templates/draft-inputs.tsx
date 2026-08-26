"use client";

import {
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from "react";

type ManagedInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "onBlur" | "onKeyDown" | "onFocus"
>;

export function parseNumberDraft(
  draft: string,
  options: { min?: number; max?: number; integer?: boolean } = {}
): number | null {
  if (draft.trim() === "") return null;

  const value = Number(draft);
  if (!Number.isFinite(value)) return null;

  const normalized = options.integer ? Math.round(value) : value;
  if (options.min !== undefined && normalized < options.min) return null;
  if (options.max !== undefined && normalized > options.max) return null;
  return normalized;
}

interface DraftNumberInputProps extends ManagedInputProps {
  value: number;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
  integer?: boolean;
}

export function DraftNumberInput({
  value,
  onCommit,
  min,
  max,
  integer = false,
  ...inputProps
}: DraftNumberInputProps) {
  const [draft, setDraft] = useState(String(value));
  const [editing, setEditing] = useState(false);
  const cancelBlur = useRef(false);

  function handleBlur() {
    setEditing(false);
    if (cancelBlur.current) {
      cancelBlur.current = false;
      setDraft(String(value));
      return;
    }

    const next = parseNumberDraft(draft, { min, max, integer });
    if (next === null) {
      setDraft(String(value));
      return;
    }

    setDraft(String(next));
    if (next !== value) onCommit(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelBlur.current = true;
      setDraft(String(value));
      event.currentTarget.blur();
    }
  }

  return (
    <input
      {...inputProps}
      type="number"
      min={min}
      max={max}
      step={integer ? 1 : inputProps.step}
      value={editing ? draft : String(value)}
      onFocus={() => {
        setDraft(String(value));
        setEditing(true);
      }}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}

interface DraftTextInputProps extends ManagedInputProps {
  value: string;
  onCommit: (value: string) => void;
  required?: boolean;
  normalize?: (draft: string) => string;
}

export function DraftTextInput({
  value,
  onCommit,
  required = false,
  normalize = (draft) => draft.trim(),
  ...inputProps
}: DraftTextInputProps) {
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  const cancelBlur = useRef(false);

  function handleBlur() {
    setEditing(false);
    if (cancelBlur.current) {
      cancelBlur.current = false;
      setDraft(value);
      return;
    }

    const next = normalize(draft);
    if (required && next === "") {
      setDraft(value);
      return;
    }

    setDraft(next);
    if (next !== value) onCommit(next);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelBlur.current = true;
      setDraft(value);
      event.currentTarget.blur();
    }
  }

  return (
    <input
      {...inputProps}
      required={required}
      value={editing ? draft : value}
      onFocus={() => {
        setDraft(value);
        setEditing(true);
      }}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}
