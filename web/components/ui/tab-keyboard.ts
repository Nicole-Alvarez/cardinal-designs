import type { KeyboardEvent } from "react";

export function handleTabKeyboardNavigation(
  event: KeyboardEvent<HTMLButtonElement>,
  index: number,
  count: number,
  onSelect: (index: number) => void
) {
  let nextIndex: number | null = null;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    nextIndex = (index + 1) % count;
  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    nextIndex = (index - 1 + count) % count;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = count - 1;
  }
  if (nextIndex === null) return;
  event.preventDefault();
  onSelect(nextIndex);
  const tabs = event.currentTarget
    .closest("[role='tablist']")
    ?.querySelectorAll<HTMLElement>("[role='tab']");
  tabs?.[nextIndex]?.focus();
}
