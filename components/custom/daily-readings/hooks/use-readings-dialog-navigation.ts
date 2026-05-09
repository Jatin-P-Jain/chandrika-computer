import * as React from "react";

import type { Denomination } from "@/types/readings";

type Step = "photocopy" | "stamp" | "review";

type Args = {
  photoPrev: number;
  stampPrev: Record<Denomination, number>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setStep: React.Dispatch<React.SetStateAction<Step>>;
  setManualPhotoPrev: React.Dispatch<React.SetStateAction<number>>;
  setManualStampPrev: React.Dispatch<
    React.SetStateAction<Record<Denomination, number>>
  >;
  setResolverOpenedFromEdit: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPreviousReadingsResolver: React.Dispatch<
    React.SetStateAction<boolean>
  >;
};

export function useReadingsDialogNavigation({
  photoPrev,
  stampPrev,
  setOpen,
  setStep,
  setManualPhotoPrev,
  setManualStampPrev,
  setResolverOpenedFromEdit,
  setShowPreviousReadingsResolver,
}: Args) {
  const allowMobileCloseRef = React.useRef(false);

  const dismissKeyboard = React.useCallback(() => {
    const activeEl = document.activeElement;
    if (activeEl instanceof HTMLElement) {
      activeEl.blur();
    }
  }, []);

  const closeDialog = React.useCallback(() => {
    dismissKeyboard();
    allowMobileCloseRef.current = true;
    setOpen(false);
  }, [dismissKeyboard, setOpen]);

  const goToStep = React.useCallback(
    (nextStep: Step) => {
      dismissKeyboard();
      setStep(nextStep);
    },
    [dismissKeyboard, setStep]
  );

  const openPreviousReadingsResolverFromEdit = React.useCallback(() => {
    dismissKeyboard();
    setManualPhotoPrev(photoPrev);
    setManualStampPrev(stampPrev);
    setResolverOpenedFromEdit(true);
    setShowPreviousReadingsResolver(true);
  }, [
    dismissKeyboard,
    photoPrev,
    setManualPhotoPrev,
    setManualStampPrev,
    setResolverOpenedFromEdit,
    setShowPreviousReadingsResolver,
    stampPrev,
  ]);

  const handleMobileDrawerOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        allowMobileCloseRef.current = false;
        setOpen(true);
        return;
      }

      if (!allowMobileCloseRef.current) {
        return;
      }

      allowMobileCloseRef.current = false;
      setOpen(false);
    },
    [setOpen]
  );

  return {
    closeDialog,
    goToStep,
    openPreviousReadingsResolverFromEdit,
    handleMobileDrawerOpenChange,
  };
}
