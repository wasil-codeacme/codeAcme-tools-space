import { z } from 'zod';
import { Role } from '@/generated/prisma/enums';
import { MAX_NAME_LENGTH } from '@/lib/constants';
import { passwordSchema } from '@/server/validators/auth.schema';
import { idSchema } from '@/server/validators/shared.schema';

const nameSchema = z.string().trim().min(1, 'Enter a name.').max(MAX_NAME_LENGTH);
const roleSchema = z.enum([Role.ADMIN, Role.MEMBER]);

export const createUserSchema = z.object({
  name: nameSchema,
  email: z.email('Enter a valid email.').trim().toLowerCase(),
  role: roleSchema,
  password: passwordSchema,
});

export const updateUserSchema = z.object({
  userId: idSchema,
  name: nameSchema,
  role: roleSchema,
});

export const setUserActiveSchema = z.object({
  userId: idSchema,
  isActive: z.boolean(),
});

export const resetUserPasswordSchema = z.object({
  userId: idSchema,
  password: passwordSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SetUserActiveInput = z.infer<typeof setUserActiveSchema>;
export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>;
