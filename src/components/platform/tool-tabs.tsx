'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ToolId, getTool } from '@/config/tools';
import { cn } from '@/lib/utils';

interface ToolTabsProps {
  toolId: ToolId;
  isAdmin: boolean;
}

export function ToolTabs({ toolId, isAdmin }: ToolTabsProps) {
  const pathname = usePathname();
  const tool = getTool(toolId);
  const items = tool.navigation.filter((item) => isAdmin || !item.adminOnly);

  return (
    <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="bg-accent text-accent-foreground ring-primary/10 flex size-9 items-center justify-center rounded-xl ring-1">
          <tool.icon className="size-4.5" />
        </span>
        <h1 className="font-heading text-xl font-semibold tracking-tight">{tool.name}</h1>
      </div>
      <nav
        aria-label={`${tool.name} sections`}
        className="bg-card/70 flex w-fit gap-1 overflow-x-auto rounded-xl border p-1 backdrop-blur"
      >
        {items.map((item) => {
          const isActive =
            item.href === tool.href ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'text-muted-foreground hover:text-foreground rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-200',
                isActive &&
                  'bg-primary text-primary-foreground hover:text-primary-foreground shadow-sm',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
