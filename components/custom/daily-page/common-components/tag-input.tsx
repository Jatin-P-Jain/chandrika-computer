// components/TagInput.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, XCircleIcon } from "lucide-react";
import { capitalizePhrase } from "@/lib/utils";
import { useKeyboard } from "@/context/keyboard-context";

interface TagInputProps {
  label: string;
  values?: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  label,
  values,
  onChange,
  disabled = false,
  placeholder = "Type and press Enter",
}) => {
  const { setActiveElement } = useKeyboard();
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    const trimmed = capitalizePhrase(inputValue.trim());
    if (trimmed && values && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInputValue("");
  };

  const removeTag = (index: number) => {
    if (values) onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col">
      <label className="flex items-start justify-start gap-1 text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex gap-2">
        <Input
          onFocus={(el) => setActiveElement(el.currentTarget)}
          autoComplete="on"
          value={inputValue}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
        />
        <Button
          type="button"
          variant="default"
          onClick={addTag}
          disabled={disabled || !inputValue.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {values && values.length > 0 && (
        <div
          className={`${
            disabled ? "opacity-70" : ""
          } mt-2 flex flex-wrap gap-2`}
        >
          {values.map((tag, idx) => (
            <span
              key={idx}
              className="flex items-center gap-2 rounded-md bg-gray-100 px-2 py-1 text-sm"
            >
              {tag}
              <XCircleIcon
                className="text-primary h-4 w-4 rounded-sm"
                onClick={() => {
                  if (!disabled) {
                    removeTag(idx);
                  }
                }}
              />
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
