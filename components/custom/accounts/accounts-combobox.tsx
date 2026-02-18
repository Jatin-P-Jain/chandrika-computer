"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  createAccount,
  listAccounts,
  AccountDoc,
} from "@/app/accounts/accounts-actions";
import { useTranslations } from "next-intl";

type Props = {
  value: string; // accountId
  onChange: (accountId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onAccountMeta?: (meta: { id: string; name: string }) => void;
};

export function AccountComboBox({
  value,
  onChange,
  disabled,
  onAccountMeta,
}: Props) {
  const tCommon = useTranslations("Common");
  const tCreditsDebits = useTranslations("CreditsDebits");
  const [open, setOpen] = React.useState(false);
  const [accounts, setAccounts] = React.useState<AccountDoc[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected = React.useMemo(
    () => accounts.find((a) => a.id === value) ?? null,
    [accounts, value],
  );

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAccounts();
      setAccounts(res.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const normalizedQuery = query.trim();
  const exactMatch = React.useMemo(() => {
    if (!normalizedQuery) return false;
    return accounts.some(
      (a) => a.name.trim().toLowerCase() === normalizedQuery.toLowerCase(),
    );
  }, [accounts, normalizedQuery]);

  async function onCreate() {
    const name = normalizedQuery;
    if (!name) return;

    setCreating(true);
    try {
      const res = await createAccount(name);

      setAccounts((prev) => {
        const without = prev.filter((a) => a.id !== res.data.id);
        return [res.data, ...without];
      });

      onChange(res.data.id);
      onAccountMeta?.({ id: res.data.id, name: res.data.name });

      setOpen(false);
      setQuery("");
    } finally {
      setCreating(false);
    }
  }

  function onSelectAccount(a: AccountDoc) {
    onChange(a.id);
    onAccountMeta?.({ id: a.id, name: a.name });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          {creating && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
              <span className="text-sm flex items-center gap-2">
                <Loader2 className="animate-spin h-4 w-4" />
                {tCreditsDebits("Creating account...")}
              </span>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between"
          >
            {selected ? selected.name : tCreditsDebits("SelectAccount")}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="relative">
          {creating && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
              <span className="text-sm flex items-center gap-2">
                <Loader2 className="animate-spin h-4 w-4" />
              </span>
            </div>
          )}
          <Command shouldFilter={true}>
            <CommandInput
              placeholder={
                loading ? tCommon("Loading") : tCreditsDebits("SearchAccount")
              }
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>
                <div className="p-2 text-sm">
                  {tCreditsDebits("NoAccountsFound")}
                  {normalizedQuery && !exactMatch ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-2 w-full justify-center"
                      onClick={onCreate}
                      disabled={creating}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {tCommon("Create")} “{normalizedQuery}”
                    </Button>
                  ) : null}
                </div>
              </CommandEmpty>

              <CommandGroup heading={tCreditsDebits("Accounts")}>
                {accounts.map((a) => (
                  <CommandItem
                    key={a.id}
                    value={a.name}
                    onSelect={() => onSelectAccount(a)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === a.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {a.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </PopoverContent>
    </Popover>
  );
}
