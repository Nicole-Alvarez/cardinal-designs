import type React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "default" | "compact" | "icon";

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:bg-accent-hover active:bg-accent-active",
  secondary:
    "border border-border-strong bg-surface-2 text-text-primary hover:bg-surface-3 active:bg-surface-selected",
  ghost:
    "text-text-secondary hover:bg-surface-2 hover:text-text-primary active:bg-surface-selected",
  destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
};

const sizeClassNames: Record<ButtonSize, string> = {
  default: "min-h-11 px-4 py-2 text-sm",
  compact: "min-h-11 px-3 py-2 text-xs",
  icon: "size-11 p-0",
};

export function buttonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "default",
  className = ""
): string {
  return [
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-app disabled:pointer-events-none disabled:opacity-60",
    variantClassNames[variant],
    sizeClassNames[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }
): React.JSX.Element {
  const { variant = "primary", size = "default", className, ...buttonProps } = props;

  return <button className={buttonClassName(variant, size, className)} {...buttonProps} />;
}
