'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { type ToolUser, toolsForUser } from '@/config/tools';
import { ROUTES } from '@/lib/routes';
import { cn } from '@/lib/utils';

// Short labels keep every item on one line at 360px.
const SHORT_TOOL_LABELS: Record<string, string> = {
  'time-tracking': 'Time',
  accounts: 'Accounts',
  'work-timer': 'Timer',
  projects: 'Projects',
};

function isActive(pathname: string, href: string): boolean {
  return href === ROUTES.HOME ? pathname === href : pathname.startsWith(href);
}

interface TabProps {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
}

const TAB_CLASS =
  'h-auto flex-1 flex-col gap-0.5 rounded-xl px-0 py-1.5 text-[0.68rem] font-medium hover:bg-transparent';
const ICON_PILL_CLASS =
  'flex h-7 w-12 items-center justify-center rounded-full transition-colors [&_svg]:size-5';

function Tab({ href, label, icon, active }: TabProps) {
  return (
    <Button
      asChild
      variant="ghost"
      className={cn(TAB_CLASS, active ? 'text-primary' : 'text-muted-foreground')}
    >
      <Link href={href} aria-current={active ? 'page' : undefined}>
        <span className={cn(ICON_PILL_CLASS, active && 'bg-accent')}>{icon}</span>
        {label}
      </Link>
    </Button>
  );
}

// Phone navigation: the platform's tools one tap away at the bottom of the screen. Everything else
// (team, account, theme, sign out) stays in the sidebar, opened by "More".
export function MobileTabBar({ user }: { user: ToolUser }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <nav
      aria-label="Tools"
      className="bg-background/90 fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch gap-1 px-2 pt-1.5 pb-1">
        <Tab
          href={ROUTES.HOME}
          label="Home"
          icon={<House />}
          active={isActive(pathname, ROUTES.HOME)}
        />
        {toolsForUser(user).map((tool) => (
          <Tab
            key={tool.id}
            href={tool.href}
            label={SHORT_TOOL_LABELS[tool.id] ?? tool.name}
            icon={<tool.icon />}
            active={isActive(pathname, tool.href)}
          />
        ))}
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpenMobile(true)}
          className={cn(TAB_CLASS, 'text-muted-foreground')}
        >
          <span className={ICON_PILL_CLASS}>
            <Menu />
          </span>
          More
        </Button>
      </div>
    </nav>
  );
}
