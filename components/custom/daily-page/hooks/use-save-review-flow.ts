import * as React from "react";

import type { DailyFormValues } from "@/schema/daily-page.schema";
import type { ReviewItem } from "../save-review-dialog";

type ReviewMode = "BLOCK_READINGS" | "SOFT_CONFIRM";

type Args = {
  onSubmit: (data: DailyFormValues) => Promise<void>;
  suppressDraftPersistRef: React.MutableRefObject<boolean>;
};

export function useSaveReviewFlow({ onSubmit, suppressDraftPersistRef }: Args) {
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [reviewItems, setReviewItems] = React.useState<ReviewItem[]>([]);
  const [reviewMode, setReviewMode] =
    React.useState<ReviewMode>("SOFT_CONFIRM");
  const [pendingData, setPendingData] = React.useState<DailyFormValues | null>(
    null
  );

  const openBlockingReview = React.useCallback((items: ReviewItem[]) => {
    setReviewMode("BLOCK_READINGS");
    setReviewItems(items);
    setPendingData(null);
    setReviewOpen(true);
  }, []);

  const openSoftReview = React.useCallback(
    (data: DailyFormValues, items: ReviewItem[]) => {
      setReviewMode("SOFT_CONFIRM");
      setReviewItems(items);
      setPendingData(data);
      setReviewOpen(true);
    },
    []
  );

  const handleReviewOpenChange = React.useCallback(
    (open: boolean) => {
      setReviewOpen(open);
      if (!open) {
        suppressDraftPersistRef.current = false;
        setPendingData(null);
      }
    },
    [suppressDraftPersistRef]
  );

  const handleReviewConfirm = React.useCallback(async () => {
    setReviewOpen(false);
    if (!pendingData) return;
    try {
      await onSubmit(pendingData);
    } finally {
      suppressDraftPersistRef.current = false;
      setPendingData(null);
    }
  }, [onSubmit, pendingData, suppressDraftPersistRef]);

  return {
    reviewOpen,
    reviewItems,
    reviewMode,
    openBlockingReview,
    openSoftReview,
    handleReviewOpenChange,
    handleReviewConfirm,
  };
}
