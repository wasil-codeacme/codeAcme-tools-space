import { z } from 'zod';
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@/lib/constants';
import { MESSAGES } from '@/lib/messages';

export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
  .max(MAX_PASSWORD_LENGTH);

export const loginSchema = z.object({
  email: z.email('Enter a valid email.').trim().toLowerCase(),
  password: z.string().min(1, 'Enter your password.').max(MAX_PASSWORD_LENGTH),
  timeZone: z.string().max(64).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.').max(MAX_PASSWORD_LENGTH),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: MESSAGES.AUTH.PASSWORDS_DO_NOT_MATCH,
    path: ['confirmPassword'],
  });

export const requestPasswordResetSchema = z.object({
  email: z.email('Enter a valid email.').trim().toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1).max(200),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: MESSAGES.AUTH.PASSWORDS_DO_NOT_MATCH,
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
