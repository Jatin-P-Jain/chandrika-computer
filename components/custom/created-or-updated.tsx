import React from "react";
import { DateDisplay } from "./date-display";

interface CreatedOrUpdatedProps {
  created?: string | Date;
  updated?: string | Date;
}

const CreatedOrUpdated: React.FC<CreatedOrUpdatedProps> = ({
  created,
  updated,
}) => {
  // If both dates are provided and are the same, show only created
  const createdDate = created ? new Date(created) : undefined;
  const updatedDate = updated ? new Date(updated) : undefined;
  const showCreated =
    createdDate &&
    updatedDate &&
    createdDate.getTime() === updatedDate.getTime();
  return (
    <div className="flex flex-row lg:flex-col items-center justify-between lg:justify-end">
      <span className="text-xs text-muted-foreground">
        {showCreated ? "Created:" : "Last Updated:"}
      </span>
      <span className="text-xs font-medium">
        <DateDisplay value={showCreated ? created : updated} smallDay />
      </span>
    </div>
  );
};

export default CreatedOrUpdated;
