"use client";

import clsx from "clsx";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { formatINR, parseINR } from "@/lib/utils";

type AmountInputProps = {
  value: number;
  onChange: (next: number) => void;
  onBlur?: () => void | Promise<void>;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  leftAddon?: string;
  rightAddon?: string;
  readOnly?: boolean;
};

export function AmountInput({
  value,
  onChange,
  onBlur,
  placeholder = "0",
  className,
  inputClassName,
  leftAddon = "₹",
  rightAddon = "/-",
  readOnly = false,
}: AmountInputProps) {
  const [hasInteracted, setHasInteracted] = React.useState(false);
  const [raw, setRaw] = React.useState<string>("");

  // Keep raw display in sync with external value until user interacts.
  React.useEffect(() => {
    if (hasInteracted) return;

    if (Number(value) === 0) {
      setRaw(""); // empty -> placeholder shows
    } else {
      setRaw(formatINR(Number(value), false, false));
    }
  }, [value, hasInteracted]);

  return (
    <InputGroup
      className={clsx(
        "focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        className,
      )}
    >
      <InputGroupAddon>{leftAddon}</InputGroupAddon>

      <Input
        readOnly={readOnly}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        className={clsx(
          "text-center font-semibold",
          "focus-visible:ring-0 focus-visible:ring-offset-0",
          "w-full border-0 shadow-none h-full",
          "dark:bg-transparent",
          inputClassName,
        )}
        value={raw}
        onFocus={() => setHasInteracted(true)}
        onChange={(e) => {
          setHasInteracted(true);
          const input = e.target;
          const nextRaw = input.value;
          const cursorPos = input.selectionStart ?? nextRaw.length;

          // Count digits before cursor to restore cursor position after formatting.
          const digitsBeforeCursor = nextRaw
            .slice(0, cursorPos)
            .replace(/[^0-9]/g, "").length;

          if (nextRaw.trim() === "") {
            setRaw("");
            onChange(0);
            return;
          }

          const nextNumber = parseINR(nextRaw);
          if (nextNumber === 0) {
            // Preserve what user typed (e.g. leading zeros) but report 0.
            setRaw(nextRaw.replace(/[^0-9]/g, ""));
            onChange(0);
            return;
          }

          const formatted = formatINR(nextNumber, false, false);
          setRaw(formatted);
          onChange(nextNumber);

          // Restore cursor: advance past `digitsBeforeCursor` digits in the formatted string.
          requestAnimationFrame(() => {
            let seen = 0;
            let newCursor = formatted.length;
            for (let i = 0; i < formatted.length; i++) {
              if (/[0-9]/.test(formatted[i])) seen++;
              if (seen === digitsBeforeCursor) {
                newCursor = i + 1;
                break;
              }
            }
            input.setSelectionRange(newCursor, newCursor);
          });
        }}
        onBlur={() => {
          void onBlur?.();
        }}
      />

      <InputGroupAddon align="inline-end">{rightAddon}</InputGroupAddon>
    </InputGroup>
  );
}
