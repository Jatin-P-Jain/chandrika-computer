// components/daily/ReadingInput.tsx
"use client";

import clsx from "clsx";
import { Input } from "@/components/ui/input";

type ReadingInputProps = {
  value: number;
  onChange: (next: number) => void;
  onBlur?: () => void;
  placeholder?: string;
  inputClassName?: string;
  readOnly?: boolean;
};

export function ReadingInput({
  value,
  onChange,
  onBlur,
  placeholder = "0",
  inputClassName,
  readOnly = false,
}: ReadingInputProps) {
  return (
    <Input
      readOnly={readOnly}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      className={clsx(
        "font-semibold py-2",
        "shadow-none",
        "dark:bg-transparent",
        inputClassName,
      )}
      value={value === 0 ? "" : String(value)}
      onBlur={onBlur}
      onChange={(e) => {
        const raw = e.target.value.trim();
        if (raw === "") return onChange(0);
        const next = Number(raw);
        onChange(Number.isFinite(next) ? next : 0);
      }}
    />
  );
}
