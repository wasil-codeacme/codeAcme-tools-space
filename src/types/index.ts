export type ActionError = string | Record<string, string[]>;

export type ActionResponse<T> = { data: T; error?: never } | { data?: never; error: ActionError };

export type { Actor, SessionPayload, SessionUser } from '@/types/auth';
export type { ToolDefinition } from '@/types/tool';
