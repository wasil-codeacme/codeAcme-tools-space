import { z } from 'zod';
import { MAX_SESSION_NOTE_LENGTH, MAX_SESSION_SECONDS } from '@/lib/constants';
import { idSchema, optionalTextSchema } from '@/server/validators/shared.schema';

// A finished session as timed in the browser: sent once, when the user presses Stop.
export const recordSessionSchema = z.object({
  // Set when finishing a timer that was started on the server by an earlier version of the app.
  legacySessionId: idSchema.nullish().transform((value) => value ?? null),
  clientId: idSchema.nullable(),
  note: optionalTextSchema(MAX_SESSION_NOTE_LENGTH),
  startedAt: z.iso.datetime({ offset: true }),
  endedAt: z.iso.datetime({ offset: true }),
  workedSeconds: z.number().int().min(0).max(MAX_SESSION_SECONDS),
});

export const updateSessionSchema = z.object({
  sessionId: idSchema,
  clientId: idSchema.nullable(),
  note: optionalTextSchema(MAX_SESSION_NOTE_LENGTH),
  startedAt: z.iso.datetime({ offset: true }),
  endedAt: z.iso.datetime({ offset: true }),
});

export const sessionIdSchema = z.object({ sessionId: idSchema });

export type RecordSessionInput = z.output<typeof recordSessionSchema>;
export type UpdateSessionInput = z.output<typeof updateSessionSchema>;
export type SessionIdInput = z.infer<typeof sessionIdSchema>;
