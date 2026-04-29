"use client";

import React, { useState } from "react";
import { AuditEvent } from "@/types/daily-account";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useLocaleTypography } from "@/hooks/useLocaleTypography";
import { DateDisplay } from "./date-display";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { ChevronDown } from "lucide-react";

interface AuditTrailProps {
  auditTrail?: AuditEvent[];
}

const AuditTrail: React.FC<AuditTrailProps> = ({ auditTrail = [] }) => {
  const { textSmCls } = useLocaleTypography();
  const [isOpen, setIsOpen] = useState(false);

  if (!auditTrail || auditTrail.length === 0) {
    return null;
  }

  // Sort events by timestamp (newest first)
  const sortedEvents = [...auditTrail].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const getEventColor = (entity: string): string => {
    switch (entity) {
      case "reading":
        return "bg-blue-500/20 border-blue-500/40";
      case "notes":
        return "bg-purple-500/20 border-purple-500/40";
      case "account":
        return "bg-green-500/20 border-green-500/40";
      default:
        return "bg-gray-500/20 border-gray-500/40";
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full px-0 py-1 hover:bg-muted/30 rounded text-xs font-semibold text-muted-foreground group">
          <span className={textSmCls}>Audit Trail</span>
          <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 mt-2 pt-2 border-t">
        <div className="space-y-2">
          {sortedEvents.map((event, idx) => (
            <div
              key={`event-${idx}`}
              className={`border-l-2 pl-3 py-1 text-xs space-y-0.5 ${getEventColor(event.entity)}`}
            >
              <div className="flex items-center gap-2">
                <Avatar className="size-3.5">
                  <AvatarImage src={event.user?.photoUrl || ""} />
                  <AvatarFallback className="text-[8px]"></AvatarFallback>
                </Avatar>
                <span className="font-medium text-[10px]">
                  {event.action}
                  {event.user?.displayName && ` by ${event.user.displayName}`}
                </span>
              </div>
              <DateDisplay
                value={event.timestamp}
                smallDay
                className={`text-[9px] text-muted-foreground`}
              />
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AuditTrail;
