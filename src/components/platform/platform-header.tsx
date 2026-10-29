'use client';

import { Fragment, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { TOOLS } from '@/config/tools';
import { ROUTES } from '@/lib/routes';

interface Crumb {
  label: string;
  href: string;
}

const STATIC_CRUMBS: Record<string, string> = {
  [ROUTES.ACCOUNT]: 'Account',
  [ROUTES.ADMIN.TEAM]: 'Team',
};

// Breadcrumbs come from the URL and the tool registry, so new tools get them for free.
function crumbsFor(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'Home', href: ROUTES.HOME }];
  const staticLabel = STATIC_CRUMBS[pathname];
  if (staticLabel) {
    return [...crumbs, { label: staticLabel, href: pathname }];
  }
  const tool = TOOLS.find((candidate) => pathname.startsWith(candidate.href));
  if (!tool) {
    return crumbs;
  }
  crumbs.push({ label: tool.name, href: tool.href });
  const section = [...tool.navigation]
    .filter((item) => item.href !== tool.href && pathname.startsWith(item.href))
    .at(0);
  if (section) {
    crumbs.push({ label: section.label, href: section.href });
    if (pathname !== section.href) {
      crumbs.push({ label: 'Details', href: pathname });
    }
  }
  return crumbs;
}

function PlatformBreadcrumbs() {
  const crumbs = crumbsFor(usePathname());

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.href}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {index === crumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function PlatformHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-md md:px-6">
      {/* Phones navigate with the bottom tab bar, so the sidebar toggle is desktop-only. */}
      <SidebarTrigger className="-ml-1 max-md:hidden" />
      <Separator
        orientation="vertical"
        className="mr-1 data-[orientation=vertical]:h-4 max-md:hidden"
      />
      {/* The pathname is only known per request, so the crumbs stream in after the static shell. */}
      <Suspense fallback={<Skeleton className="h-4 w-40" />}>
        <PlatformBreadcrumbs />
      </Suspense>
    </header>
  );
}
