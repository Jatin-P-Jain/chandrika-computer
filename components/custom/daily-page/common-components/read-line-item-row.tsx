import { useFormContext, useWatch } from "react-hook-form";
import clsx from "clsx";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type ReadOnlyLineItemProps = {
  namePrefix: string;
  textHeadCls: string;
  textBodyCls: string;
};

export function ReadOnlyLineItem({
  namePrefix,
  textHeadCls,
  textBodyCls,
}: ReadOnlyLineItemProps) {
  const { control } = useFormContext();
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

  const tags =
    useWatch({
      control,
      name: `${namePrefix}.tags`,
    }) || [];

  return (
    <div className="flex flex-row-reverse items-start justify-between gap-8">
      <div className="flex flex-col justify-center items-end flex-3 gap-1">
        <div
          className={clsx(
            "text-sm font-medium wrap-break-word text-right",
            textBodyCls,
          )}
        >
          {label || "-"}
        </div>
        <div className="flex flex-wrap gap-1 max-w-full justify-end">
          {tags.map((t: string, idx: number) => (
            <Badge
              key={`${t}-${idx}`}
              variant="secondary"
              className="rounded-md text-[10px] text-muted-foreground font-semibold"
            >
              {t}
            </Badge>
          ))}
        </div>
      </div>
      <div
        className={clsx("text-base font-semibold tabular-nums", textHeadCls)}
      >
        {formatINR(Number(amount) || 0)}
      </div>
    </div>
  );
}
