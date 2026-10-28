import { z } from 'zod';
import { isDateKey } from '@/lib/time-tracking/date-key';

export const idSchema = z.string().trim().min(1).max(64);

export const dateKeySchema = z
  .string()
  .refine(isDateKey, { message: 'Use a valid date (yyyy-mm-dd).' });

// Optional free-text form fields: blank input is stored as null rather than "".
export function optionalTextSchema(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength)
    .nullish()
    .transform((value) => (value ? value : null));
}
