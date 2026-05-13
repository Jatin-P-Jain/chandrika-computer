import * as React from "react";
import { toast } from "sonner";

import type { DailyFormValues } from "@/schema/daily-page.schema";
import {
  createDailyAccountItem,
  saveDailyAccountDraft,
  updateDailyAccountItem,
} from "@/app/daily-accounts/write-actions";

type DailyPageMode = "create" | "view" | "edit";
type Translator = (key: string) => string;

type Args = {
  mode: DailyPageMode;
  docId: string;
  user: Parameters<typeof saveDailyAccountDraft>[2];
  getUserToken: () => Promise<string | null | undefined>;
  getValues: () => DailyFormValues;
  isDirty: boolean;
  dirtyFields: Parameters<typeof updateDailyAccountItem>[3];
  suppressDraftPersistRef: React.MutableRefObject<boolean>;
  tToast: Translator;
  navigateToDoc: (nextDocId: string) => void;
};

export function useDailyPageSubmitFlow({
  mode,
  docId,
  user,
  getUserToken,
  getValues,
  isDirty,
  dirtyFields,
  suppressDraftPersistRef,
  tToast,
  navigateToDoc,
}: Args) {
  const persistDraft = React.useCallback(async () => {
    if (mode === "edit") return;
    if (suppressDraftPersistRef.current || !isDirty) return;

    const token = await getUserToken();
    if (!token) return;

    const result = await saveDailyAccountDraft(docId, getValues(), user, token);
    if (result.error || result.success === false) {
      toast.error("Error!", {
        description:
          ("message" in result && result.message) ||
          result.error ||
          "Failed to save changes",
      });
    }
  }, [
    docId,
    getUserToken,
    getValues,
    isDirty,
    mode,
    suppressDraftPersistRef,
    user,
  ]);

  const submitDaily = React.useCallback(
    async (data: DailyFormValues) => {
      const token = await getUserToken();
      if (!token) return;

      if (mode === "edit") {
        if (!docId) {
          toast.error("Error!", { description: "Missing docId" });
          return;
        }

        const res = await updateDailyAccountItem(
          docId,
          data,
          user,
          dirtyFields,
          token
        );

        if (res.error) {
          toast.error("Error!", {
            description: res.message || "An error occurred",
          });
          return;
        }

        toast.success("Success!", {
          description: tToast("DailyAccountFinalized"),
        });
        navigateToDoc(docId);
        return;
      }

      const saveResponse = await createDailyAccountItem(
        data,
        user,
        token,
        tToast("DailyAccountExists"),
        docId
      );

      if (!!saveResponse.error || !saveResponse.docId) {
        toast.error("Error!", { description: saveResponse.error });
        return;
      }

      navigateToDoc(saveResponse.docId);
      toast.success("Success!", {
        description: tToast("DailyAccountCompleted"),
      });
    },
    [dirtyFields, docId, getUserToken, mode, navigateToDoc, tToast, user]
  );

  return {
    persistDraft,
    submitDaily,
  };
}
