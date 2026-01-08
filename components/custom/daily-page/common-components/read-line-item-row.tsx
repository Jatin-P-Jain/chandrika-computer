import { useWatch } from "react-hook-form";
import clsx from "clsx";
import { formatINR } from "@/lib/utils";

type ReadOnlyLineItemProps = {
  control: any;
  namePrefix: string;
  textHeadCls: string;
  textBodyCls: string;
};

export function ReadOnlyLineItem({
  control,
  namePrefix,
  textHeadCls,
  textBodyCls,
}: ReadOnlyLineItemProps) {
  const label =
    useWatch({
      control,
      name: `${namePrefix}.label`,
    }) || "";

  const amount =
    useWatch({
      control,
      name: `${namePrefix}.amount`,
    }) || 0;

  return (
    <div className="flex items-center justify-between">
      <div className={clsx("text-sm font-medium truncate", textBodyCls)}>
        {label || "-"}
      </div>
      <div
        className={clsx("text-base font-semibold tabular-nums", textHeadCls)}
      >
        {formatINR(Number(amount) || 0)}
      </div>
    </div>
  );
}
