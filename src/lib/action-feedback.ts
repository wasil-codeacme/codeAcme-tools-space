import { toast } from 'sonner';
import { MESSAGES } from '@/lib/messages';
import type { ActionError } from '@/types';

type SetFieldError<FieldName extends string> = (
  field: FieldName,
  error: { type: string; message: string },
) => void;

export function actionErrorMessage(error: ActionError): string {
  return typeof error === 'string' ? error : MESSAGES.GENERIC.VALIDATION_FAILED;
}

// Shows a failed Server Action to the user: field errors go onto the form, the summary into a toast.
export function reportActionError<FieldName extends string>(
  error: ActionError,
  setFieldError?: SetFieldError<FieldName>,
): void {
  if (typeof error !== 'string' && setFieldError) {
    for (const [field, messages] of Object.entries(error)) {
      // Server field errors come from the same Zod schema the form uses, so the keys line up.
      setFieldError(field as FieldName, { type: 'server', message: messages[0] ?? '' });
    }
  }
  toast.error(actionErrorMessage(error));
}
