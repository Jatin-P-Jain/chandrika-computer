import * as React from "react";

import type { CreditDebitImperative } from "../../accounts/credit-debit-section";

type Args = {
  creditDebitAnchorRef: React.RefObject<HTMLDivElement | null>;
  creditDebitRef: React.RefObject<CreditDebitImperative | null>;
  closeReview: () => void;
};

export function useReviewNavigationActions({
  creditDebitAnchorRef,
  creditDebitRef,
  closeReview,
}: Args) {
  const scrollToSection = React.useCallback(
    (id: string) => {
      closeReview();
      requestAnimationFrame(() => {
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [closeReview]
  );

  const focusCreditDebitAndRun = React.useCallback(
    (run: (api: CreditDebitImperative) => void) => {
      closeReview();
      requestAnimationFrame(() => {
        creditDebitAnchorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });

      const api = creditDebitRef.current;
      if (api) {
        run(api);
      }
    },
    [closeReview, creditDebitAnchorRef, creditDebitRef]
  );

  const addCredit = React.useCallback(() => {
    focusCreditDebitAndRun((api) => api.addCredit());
  }, [focusCreditDebitAndRun]);

  const addDebit = React.useCallback(() => {
    focusCreditDebitAndRun((api) => api.addDebit());
  }, [focusCreditDebitAndRun]);

  return {
    scrollToSection,
    addCredit,
    addDebit,
  };
}
