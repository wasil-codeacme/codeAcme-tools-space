import type { ComponentType, SVGProps } from 'react';
import type { Role } from '@/generated/prisma/enums';

export interface ToolNavItem {
  label: string;
  href: string;
  adminOnly?: boolean;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
  roles: readonly Role[];
  // Tabs rendered inside the tool's own layout; the platform sidebar only links to `href`.
  navigation: readonly ToolNavItem[];
}
