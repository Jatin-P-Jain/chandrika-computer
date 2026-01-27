"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useEffect,
} from "react";

interface KeyboardContextType {
  isHindiActive: boolean;
  setIsHindiActive: (value: boolean) => void;
  activeElement: HTMLInputElement | null;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(
  undefined,
);

export function KeyboardProvider({ children }: { children: ReactNode }) {
  const [isHindiActive, setIsHindiActive] = useState(false);
  useEffect(() => {
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith("CHANDRIKA_COMPUTER_KEYBOARD="))
      ?.split("=")[1];

    if (cookieValue === "hi") setIsHindiActive(true);
    if (cookieValue === "en") setIsHindiActive(false);
  }, []);
  const activeElementRef = useRef<HTMLInputElement | null>(null);

  // Your mapping (unchanged)
  const hindiMap: Record<string, string> = {
    "`": "◌़",
    "~": "द्य",
    _: ".",
    "=": "◌ृ",
    "+": "◌्",
    "!": "।",
    "@": "/",
    "#": ":",
    $: "?",
    "%": "-",
    "^": "'",
    "&": "'",
    "*": "द्ध",
    "(": "त्र",
    ")": "ऋ",

    "1": "1",
    "2": "2",
    "3": "3",
    "4": "4",
    "5": "5",
    "6": "6",
    "7": "7",
    "8": "8",
    "9": "9",
    "0": "0",

    q: "ु",
    w: "ू",
    e: "म",
    r: "त",
    t: "ज",
    y: "ल",
    u: "न",
    i: "प",
    o: "व",
    p: "च",
    "[": "ख्",
    "]": ",",

    a: "ं",
    s: "े",
    d: "क",
    f: "ि",
    g: "ह",
    h: "ी",
    j: "र",
    k: "ा",
    l: "स",
    ";": "य",
    "'": "श्",

    z: "्र",
    x: "ग",
    c: "ब",
    v: "अ",
    b: "इ",
    n: "द",
    m: "उ",
    ",": "ए",
    ".": "ण्",
    "/": "ध्",

    Q: "फ",
    W: "ँ",
    E: "म्",
    R: "त्",
    T: "ज्",
    Y: "ल्",
    U: "न्",
    I: "प्",
    O: "व्",
    P: "च्",
    "{": "क्ष्",
    "}": "द्व",

    A: "ा",
    S: "ै",
    D: "क्",
    F: "थ्",
    G: "ळ",
    H: "भ्",
    J: "श्र",
    K: "ज्ञ",
    L: "स्",
    ":": "रू",
    '"': "ष्",

    Z: "र्",
    X: "ग्",
    C: "ब्",
    V: "ट",
    B: "ठ",
    N: "छ",
    M: "ड",
    "<": "ढ",
    ">": "झ",
    "?": "घ्",
    " ": " ",
  };

  useEffect(() => {
    const handleFocusIn = (evt: FocusEvent) => {
      const target = evt.target as HTMLInputElement | null;
      if (target?.tagName === "INPUT") {
        activeElementRef.current = target;
      }
    };

    const handleFocusOut = () => {
      activeElementRef.current = null;
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  // ----------------- Script rules -----------------
  const VIRAMA = "\u094D"; // ् [web:165][web:174]

  const isVowelSign = (ch: string) => /[\u093A-\u094C\u0962\u0963]/.test(ch);
  const isSyllableMark = (ch: string) => /[\u0901-\u0903]/.test(ch); // ँ ं ः
  const isConsonantLetter = (ch: string) => /[\u0915-\u0939]/.test(ch);

  const containsVowelSign = (s: string) => [...s].some(isVowelSign);

  // Compose: ा + े => ो,  ा + ै => ौ
  const composeMatras = (prevVowel: string | null, nextVowel: string) => {
    if (prevVowel === "ा" && nextVowel === "े") return "ो";
    if (prevVowel === "ा" && nextVowel === "ै") return "ौ";
    return null;
  };

  // Turn chart placeholders into real combining marks (◌ is just a placeholder)
  const normalizeMapped = (s: string) =>
    s.replaceAll("◌़", "़").replaceAll("◌्", "्").replaceAll("◌ृ", "ृ");

  // Find cluster start for multi-codepoint conjuncts
  const findClusterStart = (value: string, cursor: number) => {
    let i = cursor;
    while (i > 0 && isSyllableMark(value[i - 1])) i--;
    while (i > 0 && isVowelSign(value[i - 1])) i--;
    if (i > 0 && value[i - 1] === VIRAMA) i--;

    while (i > 0) {
      const prev = value[i - 1];
      if (isConsonantLetter(prev)) {
        i--;
        if (i > 0 && value[i - 1] === VIRAMA) {
          i--;
          continue;
        }
        continue;
      }
      break;
    }
    return i;
  };

  // NEW: If cluster ends in virama (dead consonant), first vowel-sign press should only "revive" it.
  // Example: श् + ा => श   (not शा) on first press.
  const shouldOnlyReviveVirama = (vowel: string) => {
    // Apply rule for all vowel signs (including ा)
    return isVowelSign(vowel);
  };

  const insertHindiSmart = (input: HTMLInputElement, mappedRaw: string) => {
    const mapped = normalizeMapped(mappedRaw);

    const value = input.value;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;

    // Replace selection
    if (start !== end) {
      const next = value.slice(0, start) + mapped + value.slice(end);
      input.value = next;
      const caret = start + mapped.length;
      input.setSelectionRange(caret, caret);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }

    // MATRA PATH
    if (containsVowelSign(mapped)) {
      // Keep trailing marks (ं/ँ/ः)
      let markStart = start;
      while (markStart > 0 && isSyllableMark(value[markStart - 1])) markStart--;
      const trailingMarks = value.slice(markStart, start);

      // Find previous vowel signs
      let vowelStart = markStart;
      while (vowelStart > 0 && isVowelSign(value[vowelStart - 1])) vowelStart--;
      const prevVowel = value.slice(vowelStart, markStart) || null;

      // Find cluster range
      const clusterStart = findClusterStart(value, vowelStart);
      let clusterEnd = vowelStart;

      const endsWithVirama =
        clusterEnd > clusterStart && value[clusterEnd - 1] === VIRAMA;

      // If dead consonant + vowel sign: revive only (remove virama, do not add matra yet)
      if (endsWithVirama && shouldOnlyReviveVirama(mapped)) {
        // remove the virama
        const revived =
          value.slice(0, clusterEnd - 1) + trailingMarks + value.slice(start);

        input.value = revived;
        const caret = clusterEnd - 1 + trailingMarks.length;
        input.setSelectionRange(caret, caret);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }

      // Otherwise, normal behavior:
      // - drop a trailing virama (so घ् + ा => घा)
      if (endsWithVirama) {
        // Safety: only if consonant exists before virama
        if (
          clusterEnd - 2 >= clusterStart &&
          isConsonantLetter(value[clusterEnd - 2])
        ) {
          clusterEnd -= 1;
        }
      }

      // Compose (aa+e => o), (aa+ai => au)
      const composed = prevVowel ? composeMatras(prevVowel, mapped) : null;
      const finalVowel = composed ?? mapped;

      const next =
        value.slice(0, clusterEnd) +
        finalVowel +
        trailingMarks +
        value.slice(start);

      input.value = next;
      const caret = clusterEnd + finalVowel.length + trailingMarks.length;
      input.setSelectionRange(caret, caret);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }

    // NORMAL insert
    const next = value.slice(0, start) + mapped + value.slice(start);
    input.value = next;
    const caret = start + mapped.length;
    input.setSelectionRange(caret, caret);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };

  useEffect(() => {
    const handleKeyDown = (evt: KeyboardEvent) => {
      if (!isHindiActive || !activeElementRef.current) return;
      if (evt.ctrlKey || evt.altKey || evt.metaKey) return;

      const target = activeElementRef.current;

      // 👇 Skip OTP inputs and numeric inputs
      if (
        target.dataset.disableHindiKeyboard === "true" ||
        target.type === "tel" ||
        target.type === "number" ||
        target.inputMode === "numeric"
      ) {
        return;
      }

      const mapped = hindiMap[evt.key];
      if (!mapped) return;

      evt.preventDefault();
      insertHindiSmart(target, mapped);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isHindiActive]);

  return (
    <KeyboardContext.Provider
      value={{
        isHindiActive,
        setIsHindiActive,

        activeElement: activeElementRef.current,
      }}
    >
      {children}
    </KeyboardContext.Provider>
  );
}

export function useKeyboard() {
  const context = useContext(KeyboardContext);
  if (!context)
    throw new Error("useKeyboard must be used within KeyboardProvider");
  return context;
}
