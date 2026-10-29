import { MESSAGES } from '@/lib/messages';

export class NotFoundError extends Error {
  constructor(entity: string) {
    super(`${entity} not found`);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends Error {
  constructor(reason = 'Forbidden') {
    super(reason);
    this.name = 'ForbiddenError';
  }
}

export class EmailTakenError extends Error {
  constructor() {
    super('Email already in use');
    this.name = 'EmailTakenError';
  }
}

export class LastAdminError extends Error {
  constructor() {
    super('Cannot remove the last active admin');
    this.name = 'LastAdminError';
  }
}

export class SelfActionError extends Error {
  constructor() {
    super('Action not allowed on own account');
    this.name = 'SelfActionError';
  }
}

export class InvalidCurrentPasswordError extends Error {
  constructor() {
    super('Current password is incorrect');
    this.name = 'InvalidCurrentPasswordError';
  }
}

export class InvalidResetTokenError extends Error {
  constructor() {
    super('Password reset link is invalid, used or expired');
    this.name = 'InvalidResetTokenError';
  }
}

export class AdminHasAllToolsError extends Error {
  constructor() {
    super('Admins have every tool');
    this.name = 'AdminHasAllToolsError';
  }
}

export class ClientNameTakenError extends Error {
  constructor() {
    super('Client name already in use');
    this.name = 'ClientNameTakenError';
  }
}

export class ArchivedClientError extends Error {
  constructor() {
    super('Client is archived');
    this.name = 'ArchivedClientError';
  }
}

export class CategoryNameTakenError extends Error {
  constructor() {
    super('Category name already used for this client');
    this.name = 'CategoryNameTakenError';
  }
}

export class InvalidCategoryError extends Error {
  constructor() {
    super('Category does not belong to the client or is archived');
    this.name = 'InvalidCategoryError';
  }
}

// Carries a specific, user-safe message (timer state and range problems).
export class TimerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimerError';
  }
}

const ERROR_MESSAGES = new Map<string, string>([
  ['NotFoundError', MESSAGES.GENERIC.NOT_FOUND],
  ['ForbiddenError', MESSAGES.GENERIC.FORBIDDEN],
  ['EmailTakenError', MESSAGES.USER.EMAIL_TAKEN],
  ['LastAdminError', MESSAGES.USER.LAST_ADMIN],
  ['SelfActionError', MESSAGES.USER.SELF_ACTION],
  ['InvalidCurrentPasswordError', MESSAGES.AUTH.CURRENT_PASSWORD_WRONG],
  ['InvalidResetTokenError', MESSAGES.AUTH.RESET_LINK_INVALID],
  ['AdminHasAllToolsError', MESSAGES.USER.ADMIN_HAS_ALL_TOOLS],
  ['ClientNameTakenError', MESSAGES.CLIENT.NAME_TAKEN],
  ['ArchivedClientError', MESSAGES.CLIENT.ARCHIVED],
  ['CategoryNameTakenError', MESSAGES.CATEGORY.NAME_TAKEN],
  ['InvalidCategoryError', MESSAGES.CATEGORY.INVALID],
]);

// Domain errors carry a safe, user-facing message; anything else is logged and shown generically.
export function mapError(error: unknown): string | undefined {
  if (error instanceof TimerError) {
    return error.message;
  }
  return error instanceof Error ? ERROR_MESSAGES.get(error.name) : undefined;
}
