// components/daily/SectionTotalBar.tsx
"use client";

import clsx from "clsx";

export function SectionTotalBar({
  label,
  value,
  className,
  labelClassName,
  valueClassName,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between rounded-md bg-muted/50 dark:bg-muted-foreground/10 p-1 px-3",
        className,
      )}
    >
      {label && (
        <span className={clsx("text-sm text-muted-foreground", labelClassName)}>
          {label}
        </span>
      )}
      {value && (
        <span className={clsx("text-base font-semibold", valueClassName)}>
          {value}
        </span>
      )}
    </div>
  );
}
