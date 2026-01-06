// components/daily/AmountInput.tsx
"use client";

import clsx from "clsx";
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
};

export function AmountInput({
  value,
  onChange,
  placeholder = "0",
  className,
  inputClassName,
  leftAddon = "₹",
  rightAddon = "/-",
}: AmountInputProps) {
  return (
    <InputGroup
      className={clsx(
        "focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        className
      )}
    >
      <InputGroupAddon>{leftAddon}</InputGroupAddon>
      <Input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        className={clsx(
          "text-center font-semibold",
          "focus-visible:ring-0 focus-visible:ring-offset-0",
          inputClassName
        )}
        value={value === 0 ? "" : formatINR(Number(value), false, false)}
        onChange={(e) => onChange(parseINR(e.target.value))}
      />
      <InputGroupAddon align="inline-end">{rightAddon}</InputGroupAddon>
    </InputGroup>
  );
}
