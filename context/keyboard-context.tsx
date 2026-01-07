"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useEffect,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

interface KeyboardContextType {
  isHindiActive: boolean;
  toggleHindiKeyboard: () => void;
  setActiveElement: (el: HTMLInputElement | null) => void;
  activeElement: HTMLInputElement | null;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(
  undefined
);

export function KeyboardProvider({ children }: { children: ReactNode }) {
  const [isHindiActive, setIsHindiActive] = useState(false);
  const activeElementRef = useRef<HTMLInputElement | null>(null);

  // Hindi Remington GAIL transliteration map
  const hindiMap: Record<string, string> = {
    // Consonants
    q: "क",
    w: "ख",
    e: "ग",
    r: "घ",
    t: "ङ",
    y: "च",
    u: "छ",
    i: "ज",
    o: "झ",
    p: "ञ",
    "[": "ट",
    "]": "ठ",
    a: "ड",
    s: "ढ",
    d: "ण",
    f: "त",
    g: "थ",
    h: "द",
    j: "ध",
    k: "न",
    l: "प",
    ";": "फ",
    "'": "ब",
    z: "भ",
    x: "म",
    c: "य",
    v: "र",
    b: "ल",
    n: "व",
    m: "श",

    // Matras
    "्": "्",
    "ि": "ि",
    "ी": "ी",
    "ु": "ु",
    "ू": "ू",
    "ृ": "ृ",
    "े": "े",
    "ै": "ै",
    "ो": "ो",
    "ौ": "ौ",

    // Marks & punctuation
    "ं": "ं",
    "ँ": "ँ",
    "ः": "ः",
    ".": "।",
    ",": "।",
  };

  const toggleHindiKeyboard = () => {
    setIsHindiActive((prev) => !prev);
  };

  const setActiveElement = (el: HTMLInputElement | null) => {
    activeElementRef.current = el;
  };

  // ✅ Fixed KeyboardEvent typing
  useEffect(() => {
    const handleKeyDown = (evt: KeyboardEvent) => {
      if (!isHindiActive || !activeElementRef.current) return;

      const hindiChar = hindiMap[evt.key];
      if (hindiChar && !evt.ctrlKey && !evt.altKey && !evt.metaKey) {
        evt.preventDefault();

        const input = activeElementRef.current;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const newValue =
          input.value.slice(0, start) + hindiChar + input.value.slice(end);

        input.value = newValue;
        input.setSelectionRange(
          start + hindiChar.length,
          start + hindiChar.length
        );

        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent("change", { bubbles: true }));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isHindiActive]);

  return (
    <KeyboardContext.Provider
      value={{
        isHindiActive,
        toggleHindiKeyboard,
        setActiveElement,
        activeElement: activeElementRef.current,
      }}
    >
      {children}
    </KeyboardContext.Provider>
  );
}

export function useKeyboard() {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error("useKeyboard must be used within KeyboardProvider");
  }
  return context;
}
