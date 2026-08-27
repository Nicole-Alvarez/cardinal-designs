"use client";

import type { ReactNode } from "react";
import { DraftNumberInput } from "./draft-inputs";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
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
      <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-zinc-300 px-2 py-1.5 dark:border-zinc-700">
        <span className="text-xs text-zinc-400 dark:text-zinc-500">Inherits main text color</span>
        <button
          type="button"
          onClick={() => onChange("#000000")}
          className="rounded-md border border-zinc-300 px-2 py-0.5 text-xs font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Override
        </button>
      </div>
    );
  }

  if (allowTransparent && value === "transparent") {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-zinc-300 px-2 py-1.5 dark:border-zinc-700">
        <span className="text-xs text-zinc-400 dark:text-zinc-500">Transparent</span>
        <button
          type="button"
          onClick={() => onChange("#ffffff")}
          className="rounded-md border border-zinc-300 px-2 py-0.5 text-xs font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
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
          className="h-11 w-11 cursor-pointer rounded border border-zinc-300 bg-transparent p-1 dark:border-zinc-700"
        />
        <input
          aria-label="Color value"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-xs focus:border-zinc-500 focus:outline-none dark:border-zinc-700"
        />
      </div>
      {allowInherit && (
        <button
          type="button"
          onClick={() => onChange("inherit")}
          className="text-xs text-zinc-400 underline-offset-2 transition-colors hover:text-zinc-600 hover:underline dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          Use inherit
        </button>
      )}
      {allowTransparent && (
        <button
          type="button"
          onClick={() => onChange("transparent")}
          className="text-xs text-zinc-400 underline-offset-2 transition-colors hover:text-zinc-600 hover:underline dark:text-zinc-500 dark:hover:text-zinc-300"
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
      className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700"
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
        className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
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
