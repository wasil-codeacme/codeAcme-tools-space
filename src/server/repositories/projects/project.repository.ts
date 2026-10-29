import type { ProjectStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import type { ProjectView } from '@/types/projects';

const PROJECT_SELECT = {
  id: true,
  clientId: true,
  name: true,
  description: true,
  status: true,
  actualMinutes: true,
  billedMinutes: true,
  client: { select: { name: true } },
  _count: { select: { invoices: true } },
} as const;

interface ProjectRow {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  actualMinutes: number | null;
  billedMinutes: number | null;
  client: { name: string };
  _count: { invoices: number };
}

function toView({ client, _count, ...row }: ProjectRow): ProjectView {
  return { ...row, clientName: client.name, invoiceCount: _count.invoices };
}

export interface ProjectData {
  clientId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  actualMinutes: number | null;
  billedMinutes: number | null;
}

export const projectRepository = {
  async list(): Promise<ProjectView[]> {
    const rows = await prisma.project.findMany({
      select: PROJECT_SELECT,
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    });
    return rows.map(toView);
  },

  async findById(id: string): Promise<ProjectView | null> {
    const row = await prisma.project.findUnique({ where: { id }, select: PROJECT_SELECT });
    return row ? toView(row) : null;
  },

  findByName(clientId: string, name: string) {
    return prisma.project.findUnique({
      where: { clientId_name: { clientId, name } },
      select: { id: true },
    });
  },

  async create(data: ProjectData): Promise<ProjectView> {
    return toView(await prisma.project.create({ data, select: PROJECT_SELECT }));
  },

  async update(id: string, data: ProjectData): Promise<ProjectView> {
    return toView(await prisma.project.update({ where: { id }, data, select: PROJECT_SELECT }));
  },
};
