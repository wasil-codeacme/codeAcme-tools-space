import 'server-only';
import { refresh } from 'next/cache';
import { type ZodType, z } from 'zod';
import { type ToolId, canUseTool } from '@/config/tools';
import { Role, ToolAccessLevel } from '@/generated/prisma/enums';
import { logger } from '@/lib/logger';
import { MESSAGES } from '@/lib/messages';
import { getSessionUser } from '@/server/auth/session-context';
import { mapError } from '@/server/errors';
import type { ActionError, ActionResponse } from '@/types';
import type { SessionUser } from '@/types/auth';

// Every mutating Server Action goes through writeAction, so authentication, authorization,
// validation, error mapping and the UI refresh cannot be skipped by a new action.

interface WriteActionConfig<Input, Output> {
  input: ZodType<Input>;
  run: (input: Input, actor: SessionUser) => Promise<Output>;
  fallback: string;
  logMessage: string;
  requireAdmin?: boolean;
  tool?: ToolId;
  // Writes need edit access by default; view-only members can still read the tool.
  toolLevel?: ToolAccessLevel;
}

export function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const { fieldErrors } = z.flattenError(error);
  return Object.fromEntries(
    Object.entries(fieldErrors).filter((entry): entry is [string, string[]] =>
      Array.isArray(entry[1]),
    ),
  );
}

export function validationError(error: z.ZodError): ActionError {
  const fieldErrors = toFieldErrors(error);
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : MESSAGES.GENERIC.VALIDATION_FAILED;
}

function authorize<Input, Output>(
  config: WriteActionConfig<Input, Output>,
  actor: SessionUser | null,
): ActionError | null {
  if (!actor) {
    return MESSAGES.AUTH.SESSION_EXPIRED;
  }
  if (config.requireAdmin && actor.role !== Role.ADMIN) {
    return MESSAGES.GENERIC.FORBIDDEN;
  }
  if (config.tool && !canUseTool(actor, config.tool, config.toolLevel ?? ToolAccessLevel.EDIT)) {
    return MESSAGES.GENERIC.FORBIDDEN;
  }
  return null;
}

export function writeAction<Input, Output>(
  config: WriteActionConfig<Input, Output>,
): (raw: unknown) => Promise<ActionResponse<Output>> {
  return async (raw: unknown) => {
    const actor = await getSessionUser();
    const denied = authorize(config, actor);
    if (denied || !actor) {
      return { error: denied ?? MESSAGES.AUTH.SESSION_EXPIRED };
    }

    const parsed = config.input.safeParse(raw);
    if (!parsed.success) {
      return { error: validationError(parsed.error) };
    }

    try {
      const data = await config.run(parsed.data, actor);
      refresh();
      return { data };
    } catch (error) {
      const mapped = mapError(error);
      if (mapped) {
        return { error: mapped };
      }
      logger.error({ err: error, actorId: actor.id }, config.logMessage);
      return { error: config.fallback };
    }
  };
}
