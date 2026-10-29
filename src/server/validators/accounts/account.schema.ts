import { z } from 'zod';
import { AccountAccessLevel, SecretLocation } from '@/generated/prisma/enums';
import {
  MAX_ACCOUNT_NOTES_LENGTH,
  MAX_ACCOUNT_PURPOSE_LENGTH,
  MAX_IMPORT_ACCOUNTS,
  MAX_LINK_LENGTH,
  MAX_NAME_LENGTH,
  MAX_SECRET_LENGTH,
} from '@/lib/constants';
import { MESSAGES } from '@/lib/messages';
import { idSchema, optionalTextSchema } from '@/server/validators/shared.schema';
import { RevealIntent, SecretField } from '@/types/accounts';

const accessLevelSchema = z
  .enum([AccountAccessLevel.MASTER, AccountAccessLevel.ADMIN, AccountAccessLevel.USER])
  .nullable();

const urlSchema = z
  .string()
  .trim()
  .max(MAX_LINK_LENGTH)
  .nullish()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || URL.canParse(value), {
    message: 'Enter a full URL, e.g. https://example.com',
  });

const MAX_LOCATION_NOTE_LENGTH = 500;

const storageLocationSchema = z
  .enum([
    SecretLocation.TOOLS_VAULT,
    SecretLocation.BITWARDEN,
    SecretLocation.ONE_PASSWORD,
    SecretLocation.CLIENT_HOLDS,
    SecretLocation.OTHER,
  ])
  .nullable();

// Blank means "leave the stored secret as it is" when editing.
const secretInputSchema = z
  .string()
  .max(MAX_SECRET_LENGTH)
  .optional()
  .transform((value) => (value ? value : undefined));

export const accountFieldsSchema = z.object({
  // Null is a CodeAcme internal account.
  clientId: idSchema.nullable(),
  name: z.string().trim().min(1, 'Enter the tool or service name.').max(MAX_NAME_LENGTH),
  purpose: optionalTextSchema(MAX_ACCOUNT_PURPOSE_LENGTH),
  accessLevel: accessLevelSchema,
  url: urlSchema,
  username: optionalTextSchema(MAX_NAME_LENGTH),
  twoFactor: optionalTextSchema(MAX_NAME_LENGTH),
  notes: optionalTextSchema(MAX_ACCOUNT_NOTES_LENGTH),
  storageLocation: storageLocationSchema,
  locationNote: optionalTextSchema(MAX_LOCATION_NOTE_LENGTH),
  secret: secretInputSchema,
  secureNotes: secretInputSchema,
});

export const updateAccountSchema = accountFieldsSchema.extend({ accountId: idSchema });

export const setAccountArchivedSchema = z.object({
  accountId: idSchema,
  isArchived: z.boolean(),
});

export const revealSecretSchema = z.object({
  accountId: idSchema,
  field: z.enum([SecretField.SECRET, SecretField.SECURE_NOTES]),
  intent: z.enum([RevealIntent.REVEAL, RevealIntent.COPY]),
});

export const importAccountsSchema = z.object({
  clientId: idSchema.nullable(),
  rows: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
        purpose: optionalTextSchema(MAX_ACCOUNT_PURPOSE_LENGTH),
        url: urlSchema,
        username: optionalTextSchema(MAX_NAME_LENGTH),
        accessLevel: accessLevelSchema,
        twoFactor: optionalTextSchema(MAX_NAME_LENGTH),
      }),
    )
    .min(1, MESSAGES.ACCOUNT.IMPORT_EMPTY)
    .max(MAX_IMPORT_ACCOUNTS),
});

export type AccountFields = z.output<typeof accountFieldsSchema>;
export type UpdateAccountInput = z.output<typeof updateAccountSchema>;
export type SetAccountArchivedInput = z.infer<typeof setAccountArchivedSchema>;
export type RevealSecretInput = z.infer<typeof revealSecretSchema>;
export type ImportAccountsInput = z.output<typeof importAccountsSchema>;
