"use client";

import clsx from "clsx";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { formatINR, parseINR } from "@/lib/utils";

type AmountInputProps = {
  value: number;
  onChange: (next: number) => void;
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

          const nextRaw = e.target.value;

          // If user deletes everything, show placeholder again
          // and keep numeric value as 0.
          if (nextRaw.trim() === "") {
            setRaw("");
            onChange(0);
            return;
          }

          const nextNumber = parseINR(nextRaw);
          onChange(nextNumber);

          // Re-format what user typed (same behavior as before),
          // but now we still allow the field to become truly empty.
          setRaw(formatINR(nextNumber, false, false));
        }}
      />

      <InputGroupAddon align="inline-end">{rightAddon}</InputGroupAddon>
    </InputGroup>
  );
}
