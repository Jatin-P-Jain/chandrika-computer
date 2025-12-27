import { useEffect, useState } from "react";

let oneTapFinishedGlobal = false;
const listeners: ((val: boolean) => void)[] = [];

export function useOneTapReady() {
  const [ready, setReady] = useState(oneTapFinishedGlobal);

  useEffect(() => {
    const listener = (val: boolean) => setReady(val);
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index !== -1) listeners.splice(index, 1);
    };
  }, []);

  return ready;
}

export function markOneTapAsFinished() {
  if (!oneTapFinishedGlobal) {
    oneTapFinishedGlobal = true;
    listeners.forEach((cb) => cb(true));
  }
}
