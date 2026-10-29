import { prisma } from '@/lib/prisma';
import type { PaymentProfileView } from '@/types/projects';

const PROFILE_SELECT = {
  id: true,
  label: true,
  details: true,
  paymentLink: true,
  isFavorite: true,
} as const;

export interface PaymentProfileData {
  label: string;
  details: string;
  paymentLink: string | null;
  isFavorite: boolean;
}

export const paymentProfileRepository = {
  list(): Promise<PaymentProfileView[]> {
    return prisma.paymentProfile.findMany({
      select: PROFILE_SELECT,
      orderBy: [{ isFavorite: 'desc' }, { label: 'asc' }],
    });
  },

  findById(id: string): Promise<PaymentProfileView | null> {
    return prisma.paymentProfile.findUnique({ where: { id }, select: PROFILE_SELECT });
  },

  create(data: PaymentProfileData): Promise<PaymentProfileView> {
    return prisma.paymentProfile.create({ data, select: PROFILE_SELECT });
  },

  update(id: string, data: PaymentProfileData): Promise<PaymentProfileView> {
    return prisma.paymentProfile.update({ where: { id }, data, select: PROFILE_SELECT });
  },

  async delete(id: string): Promise<void> {
    await prisma.paymentProfile.delete({ where: { id } });
  },
};
