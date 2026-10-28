import { z } from 'zod';
import {
  MAX_ENTRY_MINUTES,
  MAX_IMPORT_ENTRIES,
  MAX_LINK_LENGTH,
  MAX_NAME_LENGTH,
  MAX_TASK_LENGTH,
  MIN_ENTRY_MINUTES,
} from '@/lib/constants';
import { MESSAGES } from '@/lib/messages';
import { parseDuration } from '@/lib/time-tracking/parse-duration';
import { dateKeySchema, idSchema, optionalTextSchema } from '@/server/validators/shared.schema';

const durationMinutesSchema = z
  .number({ error: MESSAGES.ENTRY.INVALID_DURATION })
  .int(MESSAGES.ENTRY.INVALID_DURATION)
  .min(MIN_ENTRY_MINUTES, MESSAGES.ENTRY.INVALID_DURATION)
  .max(MAX_ENTRY_MINUTES, MESSAGES.ENTRY.INVALID_DURATION);

const taskSchema = z.string().trim().min(1, 'Describe what you worked on.').max(MAX_TASK_LENGTH);

const linkSchema = z
  .string()
  .trim()
  .max(MAX_LINK_LENGTH)
  .nullish()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || URL.canParse(value), { message: 'Enter a full URL.' });

export const entryFieldsSchema = z.object({
  clientId: idSchema,
  dateKey: dateKeySchema,
  durationMinutes: durationMinutesSchema,
  task: taskSchema,
  categoryId: idSchema.nullish().transform((value) => value ?? null),
  requestedBy: optionalTextSchema(MAX_NAME_LENGTH),
  link: linkSchema,
  needsReview: z.boolean().default(false),
});

export const updateEntrySchema = entryFieldsSchema.extend({ entryId: idSchema });

export const deleteEntrySchema = z.object({ entryId: idSchema });

export const restoreEntrySchema = entryFieldsSchema.extend({ userId: idSchema });

export const importEntriesSchema = z.object({
  clientId: idSchema,
  categoryId: idSchema.nullish().transform((value) => value ?? null),
  entries: z
    .array(
      z.object({
        dateKey: dateKeySchema,
        durationMinutes: durationMinutesSchema,
        task: taskSchema,
        needsReview: z.boolean(),
      }),
    )
    .min(1, MESSAGES.ENTRY.IMPORT_EMPTY)
    .max(MAX_IMPORT_ENTRIES),
});

export type EntryFieldsInput = z.input<typeof entryFieldsSchema>;
export type EntryFields = z.output<typeof entryFieldsSchema>;
export type UpdateEntryInput = z.output<typeof updateEntrySchema>;
export type DeleteEntryInput = z.infer<typeof deleteEntrySchema>;
export type RestoreEntryInput = z.output<typeof restoreEntrySchema>;
export type ImportEntriesInput = z.output<typeof importEntriesSchema>;

// What the quick-add and edit rows hold before the duration text is turned into minutes.
export const entryFormSchema = z.object({
  duration: z
    .string()
    .trim()
    .refine((value) => parseDuration(value) !== null, { message: MESSAGES.ENTRY.INVALID_DURATION }),
  task: taskSchema,
  categoryId: z.string(),
  requestedBy: z.string().trim().max(MAX_NAME_LENGTH),
  link: z
    .string()
    .trim()
    .max(MAX_LINK_LENGTH)
    .refine((value) => value === '' || URL.canParse(value), { message: 'Enter a full URL.' }),
  needsReview: z.boolean(),
});

export type EntryFormValues = z.infer<typeof entryFormSchema>;
