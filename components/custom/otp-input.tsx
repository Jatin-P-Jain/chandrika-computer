// components/OTPInput.tsx
import React, { useEffect, useRef, FC } from "react";
import { Input } from "@/components/ui/input";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
}

const OTPInput: FC<OTPInputProps> = ({ length = 6, value, onChange }) => {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // 1) Sync each box's value whenever `value` changes
  useEffect(() => {
    const digits = value.split("");
    inputsRef.current.forEach((el, i) => {
      if (el) el.value = digits[i] ?? "";
    });
  }, [value]);

  // 2) Only autofocus the very first box once on mount
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const raw = e.currentTarget.value.replace(/\D/g, "").slice(-1);
    if (!raw) {
      onChange(value.slice(0, idx));
      return;
    }
    const newVal = value.substring(0, idx) + raw + value.substring(idx + 1);
    onChange(newVal);
    // move focus forward
    inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number,
  ) => {
    // Allow control keys
    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ];

    // Allow Ctrl/Cmd shortcuts
    if (e.ctrlKey || e.metaKey) {
      return;
    }

    // Allow numeric keys
    const isNumeric = /^[0-9]$/.test(e.key);

    // Block everything else
    if (!allowedKeys.includes(e.key) && !isNumeric) {
      e.preventDefault();
      return;
    }

    // Handle backspace navigation
    if (e.key === "Backspace" && !e.currentTarget.value && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  // 👇 Optional: Handle paste to only accept digits
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain");
    const digits = pastedData.replace(/\D/g, "").slice(0, length);
    onChange(digits);
  };

  return (
    <div className="mx-auto flex w-full items-center justify-center gap-1  md:gap-4">
      {Array.from({ length }).map((_, i) => (
        <Input
          key={i}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          className="min-w-0 flex-1 text-center text-base md:text-xl shadow-md"
          data-disable-hindi-keyboard="true"
          ref={(el) => {
            inputsRef.current[i] = el ?? null;
          }}
          onChange={(e) => handleInput(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={(e) => handlePaste(e)}
        />
      ))}
    </div>
  );
};

export default OTPInput;
