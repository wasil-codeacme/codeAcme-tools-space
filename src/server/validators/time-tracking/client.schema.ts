import { z } from 'zod';
import { MAX_MONTHLY_LIMIT_HOURS, MAX_NAME_LENGTH } from '@/lib/constants';
import { idSchema, optionalTextSchema } from '@/server/validators/shared.schema';

// Form inputs arrive as strings; blank means "no monthly limit".
const monthlyLimitHoursSchema = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? null : Number(value)),
  z
    .number({ error: 'Enter hours as a number.' })
    .positive('Use a positive number of hours.')
    .max(MAX_MONTHLY_LIMIT_HOURS)
    .nullable(),
);

export const clientFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Enter a client name.').max(MAX_NAME_LENGTH),
  contactName: optionalTextSchema(MAX_NAME_LENGTH),
  monthlyLimitHours: monthlyLimitHoursSchema,
});

export const updateClientSchema = clientFieldsSchema.extend({ clientId: idSchema });

export const setClientArchivedSchema = z.object({
  clientId: idSchema,
  isArchived: z.boolean(),
});

export const clientMembershipSchema = z.object({
  clientId: idSchema,
  userId: idSchema,
});

const categoryNameSchema = z.string().trim().min(1, 'Enter a category name.').max(MAX_NAME_LENGTH);

export const createCategorySchema = z.object({
  clientId: idSchema,
  name: categoryNameSchema,
});

export const renameCategorySchema = z.object({
  categoryId: idSchema,
  name: categoryNameSchema,
});

export const setCategoryArchivedSchema = z.object({
  categoryId: idSchema,
  isArchived: z.boolean(),
});

export type ClientFieldsInput = z.input<typeof clientFieldsSchema>;
export type ClientFields = z.output<typeof clientFieldsSchema>;
export type UpdateClientInput = z.output<typeof updateClientSchema>;
export type SetClientArchivedInput = z.infer<typeof setClientArchivedSchema>;
export type ClientMembershipInput = z.infer<typeof clientMembershipSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type RenameCategoryInput = z.infer<typeof renameCategorySchema>;
export type SetCategoryArchivedInput = z.infer<typeof setCategoryArchivedSchema>;
