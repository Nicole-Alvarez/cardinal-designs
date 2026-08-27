"use client";

import type { ReactNode } from "react";
import { DraftNumberInput } from "./draft-inputs";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      {children}
    </label>
  );
}

export function ColorInput({
  value,
  onChange,
  allowInherit = false,
  allowTransparent = false,
}: {
  value: string;
  onChange: (value: string) => void;
  allowInherit?: boolean;
  allowTransparent?: boolean;
}) {
  if (allowInherit && value === "inherit") {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border-subtle px-2 py-1.5">
        <span className="text-xs text-text-muted">Inherits main text color</span>
        <button
          type="button"
          onClick={() => onChange("#000000")}
          className="min-h-11 rounded-md border border-border-subtle px-2 text-xs font-medium text-text-secondary outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-focus"
        >
          Override
        </button>
      </div>
    );
  }

  if (allowTransparent && value === "transparent") {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border-subtle px-2 py-1.5">
        <span className="text-xs text-text-muted">Transparent</span>
        <button
          type="button"
          onClick={() => onChange("#ffffff")}
          className="min-h-11 rounded-md border border-border-subtle px-2 text-xs font-medium text-text-secondary outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-focus"
        >
          Override
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label="Choose color"
          value={value === "transparent" ? "#ffffff" : value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-11 cursor-pointer rounded border border-border-subtle bg-transparent p-1 outline-none focus-visible:ring-2 focus-visible:ring-focus"
        />
        <input
          aria-label="Color value"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-11 w-full rounded-lg border border-border-subtle bg-surface-2 px-2 text-xs text-text-primary outline-none focus:border-border-strong focus:ring-2 focus:ring-focus"
        />
      </div>
      {allowInherit && (
        <button
          type="button"
          onClick={() => onChange("inherit")}
          className="min-h-11 text-xs text-text-muted underline-offset-2 transition-colors hover:text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Use inherit
        </button>
      )}
      {allowTransparent && (
        <button
          type="button"
          onClick={() => onChange("transparent")}
          className="min-h-11 text-xs text-text-muted underline-offset-2 transition-colors hover:text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Use transparent
        </button>
      )}
    </div>
  );
}

export function NumberInput({
  value,
  min = 0,
  max,
  integer = false,
  "aria-label": ariaLabel,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  integer?: boolean;
  "aria-label"?: string;
  onChange: (value: number) => void;
}) {
  return (
    <DraftNumberInput
      min={min}
      max={max}
      integer={integer}
      value={value}
      onCommit={onChange}
      aria-label={ariaLabel}
      className="min-h-11 w-full rounded-lg border border-border-subtle bg-surface-2 px-2 text-sm text-text-primary outline-none focus:border-border-strong focus:ring-2 focus:ring-focus"
    />
  );
}

export function SizeSelect({
  value,
  presets,
  onChange,
}: {
  value: string | null; // null = auto
  presets: string[];
  onChange: (value: string | null) => void;
}) {
  const isCustom = value !== null && !presets.includes(value);
  const selectValue = value === null ? "auto" : isCustom ? "custom" : value;

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "auto") onChange(null);
          else if (v === "custom") onChange("200px");
          else onChange(v);
        }}
        className="min-h-11 w-full rounded-lg border border-border-subtle bg-surface-2 px-2 text-sm text-text-primary outline-none focus:border-border-strong focus:ring-2 focus:ring-focus"
      >
        <option value="auto">Auto</option>
        {presets.map((preset) => (
          <option key={preset} value={preset}>
            {preset}
          </option>
        ))}
        <option value="custom">Custom…</option>
      </select>
      {isCustom && (
        <NumberInput
          aria-label="Custom size in pixels"
          value={parseInt(value, 10) || 1}
          min={1}
          integer
          onChange={(n) => onChange(`${Math.round(n)}px`)}
        />
      )}
    </div>
  );
}
