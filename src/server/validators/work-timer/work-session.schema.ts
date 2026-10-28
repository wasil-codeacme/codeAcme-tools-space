import { z } from 'zod';
import { MAX_SESSION_NOTE_LENGTH } from '@/lib/constants';
import { idSchema, optionalTextSchema } from '@/server/validators/shared.schema';

export const startSessionSchema = z.object({
  clientId: idSchema.nullable(),
  note: optionalTextSchema(MAX_SESSION_NOTE_LENGTH),
});

export const updateSessionSchema = z.object({
  sessionId: idSchema,
  clientId: idSchema.nullable(),
  note: optionalTextSchema(MAX_SESSION_NOTE_LENGTH),
  startedAt: z.iso.datetime({ offset: true }),
  endedAt: z.iso.datetime({ offset: true }),
});

export const sessionIdSchema = z.object({ sessionId: idSchema });

export type StartSessionInput = z.output<typeof startSessionSchema>;
export type UpdateSessionInput = z.output<typeof updateSessionSchema>;
export type SessionIdInput = z.infer<typeof sessionIdSchema>;
