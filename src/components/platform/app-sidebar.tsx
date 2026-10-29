'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Users } from 'lucide-react';
import { CommandMenu } from '@/components/platform/command-menu';
import { UserMenu } from '@/components/platform/user-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { SITE } from '@/config/site';
import { toolsForUser } from '@/config/tools';
import { Role } from '@/generated/prisma/enums';
import { ROUTES } from '@/lib/routes';
import type { SessionUser } from '@/types/auth';

const TOOL_SKELETON_ROWS = 3;

function isActive(pathname: string, href: string): boolean {
  return href === ROUTES.HOME ? pathname === href : pathname.startsWith(href);
}

function SidebarBrand({ search }: { search?: React.ReactNode }) {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <Link href={ROUTES.HOME} prefetch>
              <span className="bg-background ring-border flex aspect-square size-8 items-center justify-center rounded-lg ring-1">
                <Image src={SITE.LOGO_MARK} alt="" width={22} height={13} className="h-auto" />
              </span>
              <span className="grid flex-1 text-left leading-tight">
                <span className="font-heading font-semibold tracking-tight">CodeAcme</span>
                <span className="text-muted-foreground text-xs">Tools</span>
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      {search}
    </SidebarHeader>
  );
}

export function AppSidebar({
  user,
  clients,
}: {
  user: Pick<SessionUser, 'name' | 'email' | 'role' | 'toolAccess'>;
  clients: { id: string; name: string }[];
}) {
  const pathname = usePathname();
  const tools = toolsForUser(user);

  return (
    <Sidebar collapsible="icon">
      <SidebarBrand search={<CommandMenu user={user} clients={clients} />} />
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive(pathname, ROUTES.HOME)} tooltip="Home">
                <Link href={ROUTES.HOME} prefetch>
                  <House />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tools.map((tool) => (
                <SidebarMenuItem key={tool.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(pathname, tool.href)}
                    tooltip={tool.name}
                  >
                    <Link href={tool.href} prefetch>
                      <tool.icon />
                      <span>{tool.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {user.role === Role.ADMIN && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(pathname, ROUTES.ADMIN.TEAM)}
                    tooltip="Team"
                  >
                    <Link href={ROUTES.ADMIN.TEAM} prefetch>
                      <Users />
                      <span>Team</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <UserMenu name={user.name} email={user.email} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export function AppSidebarSkeleton() {
  return (
    <Sidebar collapsible="icon">
      <SidebarBrand />
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {Array.from({ length: TOOL_SKELETON_ROWS }, (_, index) => (
              <SidebarMenuItem key={index} className="flex h-8 items-center gap-2 px-2">
                <Skeleton className="size-4 rounded-md" />
                <Skeleton className="h-4 w-3/5" />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
