"use client";

import React, { useMemo, useState } from "react";
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
import clsx from "clsx";

interface AuditTrailProps {
  auditTrail?: AuditEvent[];
}

const AuditTrail: React.FC<AuditTrailProps> = ({ auditTrail = [] }) => {
  const { textSmCls } = useLocaleTypography();
  const [isOpen, setIsOpen] = useState(false);

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

  const entityMeta: Record<string, { label: string; chipClass: string }> = {
    account: {
      label: "Account",
      chipClass:
        "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
    },
    reading: {
      label: "Readings",
      chipClass:
        "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
    },
    notes: {
      label: "Notes",
      chipClass:
        "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700",
    },
  };

  const grouped = useMemo(() => {
    const groups: Record<string, AuditEvent[]> = {
      account: [],
      reading: [],
      notes: [],
      other: [],
    };

    for (const event of sortedEvents) {
      if (event.entity === "account") {
        groups.account.push(event);
      } else if (event.entity === "reading") {
        groups.reading.push(event);
      } else if (event.entity === "notes") {
        groups.notes.push(event);
      } else {
        groups.other.push(event);
      }
    }

    return groups;
  }, [sortedEvents]);

  const sections: Array<{ key: string; label: string; events: AuditEvent[] }> =
    [
      {
        key: "account",
        label: entityMeta.account.label,
        events: grouped.account,
      },
      {
        key: "reading",
        label: entityMeta.reading.label,
        events: grouped.reading,
      },
      { key: "notes", label: entityMeta.notes.label, events: grouped.notes },
      { key: "other", label: "Other", events: grouped.other },
    ].filter((section) => section.events.length > 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full px-0 py-1 hover:bg-muted/30 rounded text-xs font-semibold text-muted-foreground group active:scale-95 transition-transform">
          <span className={textSmCls}>Audit Trail ({auditTrail.length})</span>
          <ChevronDown
            className={clsx(
              "size-4 transition-transform",
              isOpen ? "rotate-180" : "rotate-0",
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 mt-2 pt-2 border-t">
        {sortedEvents.length > 0 ? (
          <div className="space-y-3">
            {sections.map((section) => (
              <div key={section.key} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      entityMeta[section.key]?.chipClass ??
                      "bg-gray-100 text-gray-700 border-gray-300"
                    }`}
                  >
                    {section.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {section.events.length}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {section.events.map((event, idx) => (
                    <div
                      key={`${section.key}-${idx}`}
                      className={`border-l-2 pl-3 py-1 text-xs space-y-0.5 ${getEventColor(event.entity)}`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="size-3.5">
                          <AvatarImage src={event.user?.photoUrl || ""} />
                          <AvatarFallback className="text-[8px]"></AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-[10px]">
                          {event.action}
                          {event.user?.displayName
                            ? ` by ${event.user.displayName}`
                            : ""}
                        </span>
                      </div>
                      <DateDisplay
                        value={event.timestamp}
                        smallDay
                        className="text-[9px] text-muted-foreground"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-xs text-muted-foreground ${textSmCls}`}>
            No activity yet for this day.
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AuditTrail;
