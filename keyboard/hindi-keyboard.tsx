"use client";

import { useEffect, useRef, useState } from "react";
import Keyboard from "react-simple-keyboard";
import { KeyboardIcon, Globe2 } from "lucide-react";
import { useKeyboard } from "@/context/keyboard-context";
import { Button } from "@/components/ui/button";

export function GlobalRemingtonKeyboard() {
  const {
    isHindiActive,
    toggleHindiKeyboard,
    setActiveElement,
    activeElement, // ✅ Use from context
  } = useKeyboard();
  const keyboardRef = useRef<any>(null);
  const [layoutName, setLayoutName] = useState<"default" | "shift">("default");

  // Remington GAIL Hindi Layout
  const remingtonLayout = {
    default: [
      "` 1 2 3 4 5 6 7 8 9 0 - = {bksp}",
      "{tab} ि ी ु ू ृ े ै ो ौ ं ः {enter}",
      "{caps} क ख ग घ ङ च छ ज झ ञ ट ठ ड ढ {shift}",
      "ण त थ द ध न प फ ब भ म य र ल व {alt}",
      "श ष स ह क्ष त्र ॐ . , ; : ? ! {space}",
    ],
    shift: [
      "~ ! @ # $ % ^ & * ( ) _ + {bksp}",
      "{tab} ी ु ू ृ े ै ो ौ ँ ं ः {enter}",
      "{caps} ड़ ढ़ ङ छ ञ ट ठ ड ढ ण त {shift}",
      "थ द ध न प फ ब भ म य र ल व श {alt}",
      "ष स ह क्ष त्र ॐ . , ; : ? ! {space}",
    ],
  };

  // Update the onKeyPress and onChange functions:
  const onKeyPress = (button: string) => {
    const currentInput = activeElement;
    if (!currentInput) return;

    if (button === "{shift}") {
      setLayoutName(layoutName === "default" ? "shift" : "default");
    } else if (button === "{bksp}") {
      const start = currentInput.selectionStart || 0;
      const newValue =
        currentInput.value.slice(0, start - 1) +
        currentInput.value.slice(start);
      currentInput.value = newValue;
      currentInput.setSelectionRange(start - 1, start - 1);
      currentInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  const onChange = (text: string) => {
    const currentInput = activeElement; // ✅ Now works!
    if (currentInput) {
      currentInput.value = text;
      currentInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  if (!isHindiActive) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg max-h-96 overflow-auto p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleHindiKeyboard}
            className="w-full max-w-xs"
          >
            <Globe2 className="mr-2 h-4 w-4" />
            रेमिंगटन हिंदी → English
          </Button>
        </div>

        <Keyboard
          keyboardRef={(r) => (keyboardRef.current = r)}
          layoutName={layoutName}
          layout={remingtonLayout}
          onChange={onChange}
          onKeyPress={onKeyPress}
          disableButtonHold
          physicalKeyboardHighlight
          className="remington-keyboard"
        />
      </div>
    </div>
  );
}
