"use client";

import dynamic from "next/dynamic";

const IconPicker = dynamic(() => import("./icon-picker"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-label="Loading icons"
      className="min-h-48 animate-pulse rounded-xl bg-surface-2"
    />
  ),
});

export default function LazyIconPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (icon: string) => void;
}) {
  return <IconPicker value={value} onChange={onChange} />;
}
