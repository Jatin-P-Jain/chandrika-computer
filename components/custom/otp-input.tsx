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
    idx: number
  ) => {
    if (e.key === "Backspace" && !e.currentTarget.value && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
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
          ref={(el) => {
            inputsRef.current[i] = el ?? null;
          }}
          onChange={(e) => handleInput(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
        />
      ))}
    </div>
  );
};

export default OTPInput;
