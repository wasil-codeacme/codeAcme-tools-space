'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  FileText,
  House,
  KeyRound,
  Search,
  Timer,
  UserRound,
  Users,
} from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Kbd } from '@/components/ui/kbd';
import { type ToolUser, ToolId, canUseTool, toolsForUser } from '@/config/tools';
import { Role, ToolAccessLevel } from '@/generated/prisma/enums';
import { ROUTES } from '@/lib/routes';

interface CommandMenuProps {
  user: ToolUser;
  clients: { id: string; name: string }[];
}

const SHORTCUT_KEY = 'k';

// One search for everything: pages, clients and common actions. Opened from the sidebar search
// box or with Ctrl/⌘ + K from anywhere.
export function CommandMenu({ user, clients }: CommandMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const tools = toolsForUser(user);
  const isAdmin = user.role === Role.ADMIN;
  const canLogTime = canUseTool(user, ToolId.TIME_TRACKING, ToolAccessLevel.EDIT);
  const canUseTimer = canUseTool(user, ToolId.WORK_TIMER, ToolAccessLevel.EDIT);
  const canSeeAccounts = canUseTool(user, ToolId.ACCOUNTS);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === SHORTCUT_KEY && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function go(href: string) {
    setIsOpen(false);
    setQuery('');
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-muted-foreground hover:border-primary/30 hover:text-foreground bg-background flex h-9 w-full items-center gap-2 rounded-lg border px-2.5 text-sm transition-colors duration-200 group-data-[collapsible=icon]:hidden"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search…</span>
        <Kbd>Ctrl K</Kbd>
      </button>

      <CommandDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Search CodeAcme Tools"
        description="Jump to a page, a client or an action."
      >
        {/* This shadcn CommandDialog does not include the Command root itself. */}
        <Command>
          <CommandInput
            placeholder="Search pages, clients and actions…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>Nothing matches “{query}”.</CommandEmpty>

            <CommandGroup heading="Actions">
              {canUseTimer && (
                <CommandItem onSelect={() => go(ROUTES.TOOLS.WORK_TIMER.ROOT)}>
                  <Timer />
                  Start the work timer
                </CommandItem>
              )}
              {canLogTime && (
                <CommandItem onSelect={() => go(ROUTES.TOOLS.TIME_TRACKING.ROOT)}>
                  <FileText />
                  Log time
                </CommandItem>
              )}
              {isAdmin && (
                <CommandItem onSelect={() => go(ROUTES.TOOLS.PROJECTS.NEW_INVOICE)}>
                  <FileText />
                  New invoice
                </CommandItem>
              )}
            </CommandGroup>

            <CommandSeparator />
            <CommandGroup heading="Pages">
              <CommandItem onSelect={() => go(ROUTES.HOME)}>
                <House />
                Home
              </CommandItem>
              {tools.flatMap((tool) =>
                tool.navigation
                  .filter((item) => isAdmin || !item.adminOnly)
                  .map((item) => (
                    <CommandItem
                      key={item.href}
                      value={`${tool.name} ${item.label}`}
                      onSelect={() => go(item.href)}
                    >
                      <tool.icon />
                      {item.href === tool.href ? tool.name : `${tool.name} › ${item.label}`}
                    </CommandItem>
                  )),
              )}
              {isAdmin && (
                <CommandItem onSelect={() => go(ROUTES.ADMIN.TEAM)}>
                  <Users />
                  Team
                </CommandItem>
              )}
              <CommandItem onSelect={() => go(ROUTES.ACCOUNT)}>
                <UserRound />
                My account
                <CommandShortcut>Password</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            {clients.length > 0 && canUseTool(user, ToolId.TIME_TRACKING) && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Clients">
                  {clients.map((client) => (
                    <CommandItem
                      key={client.id}
                      value={`client ${client.name}`}
                      onSelect={() => go(`${ROUTES.TOOLS.TIME_TRACKING.ROOT}?client=${client.id}`)}
                    >
                      <Building2 />
                      {client.name}
                      <CommandShortcut>Time log</CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
            {canSeeAccounts && query.trim() && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Search">
                  <CommandItem
                    value={`search accounts ${query}`}
                    onSelect={() =>
                      go(`${ROUTES.TOOLS.ACCOUNTS.ROOT}?q=${encodeURIComponent(query.trim())}`)
                    }
                  >
                    <KeyRound />
                    Search accounts for “{query.trim()}”
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
