import React from "react";
import { DateDisplay } from "./date-display";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { UserMini } from "@/types/user";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";

interface CreatedOrUpdatedProps {
  created?: string | Date;
  updated?: string | Date;
  createdBy?: UserMini;
  updatedBy?: UserMini;
}

const CreatedOrUpdated: React.FC<CreatedOrUpdatedProps> = ({
  created,
  createdBy,
  updatedBy,
  updated,
}) => {
  const tCommon = useTranslations("Common");
  const { textSmCls } = useLocaleTypography();
  // If both dates are provided and are the same, show only created
  const createdDate = created ? new Date(created) : undefined;
  const updatedDate = updated ? new Date(updated) : undefined;
  const showCreated =
    createdDate &&
    updatedDate &&
    createdDate.getTime() === updatedDate.getTime();
  const user = showCreated ? createdBy : updatedBy;
  return (
    <div className="flex flex-row lg:flex-col items-start justify-between lg:justify-end lg:min-w-45 lg:items-end">
      <span className={`text-xs text-muted-foreground ${textSmCls}`}>
        {showCreated ? tCommon("CreatedAt") : tCommon("LastUpdated")}:
      </span>
      <div className="flex flex-col">
        <div className="flex justify-end items-center gap-1">
          <Avatar className="size-5 ring-1 ring-primary border">
            <AvatarImage src={user?.photoUrl || ""} />
            <AvatarFallback className="text-[10px]"></AvatarFallback>
          </Avatar>
          <span className={`font-medium ${textSmCls}`}>
            {user?.displayName}
          </span>
        </div>
        <span className={`${textSmCls}`}>
          <DateDisplay value={showCreated ? created : updated} smallDay />
        </span>
      </div>
    </div>
  );
};

export default CreatedOrUpdated;
