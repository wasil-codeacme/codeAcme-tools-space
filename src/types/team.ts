import type { Role } from '@/generated/prisma/enums';

export interface TeamMemberRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}
