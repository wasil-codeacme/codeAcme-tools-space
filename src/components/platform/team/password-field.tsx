'use client';

import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { generatePassword } from '@/lib/generate-password';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function PasswordField({ id, label, value, onChange, error }: PasswordFieldProps) {
  async function copy() {
    await navigator.clipboard.writeText(value);
    toast.success('Password copied.');
  }

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          className="font-figures"
          aria-invalid={Boolean(error)}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label="Generate another"
            onClick={() => onChange(generatePassword())}
          >
            <RefreshCw />
          </InputGroupButton>
          <InputGroupButton size="icon-xs" aria-label="Copy password" onClick={copy}>
            <Copy />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FieldDescription>Copy it now; it is not shown again.</FieldDescription>
      <FieldError>{error}</FieldError>
    </Field>
  );
}
