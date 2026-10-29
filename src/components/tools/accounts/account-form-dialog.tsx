'use client';

import { useState } from 'react';
import { Eye, EyeOff, Loader2, RefreshCw } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { OwnerSelect } from '@/components/tools/accounts/owner-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AccountAccessLevel, SecretLocation } from '@/generated/prisma/enums';
import { reportActionError } from '@/lib/action-feedback';
import { ACCESS_LEVEL_LABELS, SECRET_LOCATION_LABELS, INTERNAL_SCOPE } from '@/lib/accounts/labels';
import { generatePassword } from '@/lib/generate-password';
import { MESSAGES } from '@/lib/messages';
import { createAccount, updateAccount } from '@/server/actions/accounts/account.actions';
import type { AccountView } from '@/types/accounts';

const NO_ACCESS_LEVEL = 'none';
const NO_LOCATION = 'none';
const LOCATIONS = Object.values(SecretLocation);
const ACCESS_LEVELS = [
  AccountAccessLevel.MASTER,
  AccountAccessLevel.ADMIN,
  AccountAccessLevel.USER,
] as const;

interface AccountFormValues {
  scope: string;
  name: string;
  purpose: string;
  url: string;
  username: string;
  accessLevel: string;
  twoFactor: string;
  notes: string;
  storageLocation: string;
  locationNote: string;
  secret: string;
  secureNotes: string;
}

interface AccountFormDialogProps {
  account: AccountView | null;
  clients: { id: string; name: string }[];
  isAdmin: boolean;
  defaultScope: string;
  onClose: () => void;
}

function defaults(account: AccountView | null, defaultScope: string): AccountFormValues {
  return {
    scope: account ? (account.clientId ?? INTERNAL_SCOPE) : defaultScope,
    name: account?.name ?? '',
    purpose: account?.purpose ?? '',
    url: account?.url ?? '',
    username: account?.username ?? '',
    accessLevel: account?.accessLevel ?? NO_ACCESS_LEVEL,
    twoFactor: account?.twoFactor ?? '',
    notes: account?.notes ?? '',
    storageLocation: account?.storageLocation ?? NO_LOCATION,
    locationNote: account?.locationNote ?? '',
    secret: '',
    secureNotes: '',
  };
}

function toPayload(values: AccountFormValues) {
  const accessLevel = ACCESS_LEVELS.find((level) => level === values.accessLevel) ?? null;
  return {
    clientId: values.scope === INTERNAL_SCOPE ? null : values.scope,
    name: values.name,
    purpose: values.purpose,
    url: values.url,
    username: values.username,
    accessLevel,
    twoFactor: values.twoFactor,
    notes: values.notes,
    storageLocation: LOCATIONS.find((location) => location === values.storageLocation) ?? null,
    locationNote: values.locationNote,
    secret: values.secret,
    secureNotes: values.secureNotes,
  };
}

export function AccountFormDialog({
  account,
  clients,
  isAdmin,
  defaultScope,
  onClose,
}: AccountFormDialogProps) {
  const [showSecret, setShowSecret] = useState(false);
  const form = useForm<AccountFormValues>({ defaultValues: defaults(account, defaultScope) });
  const { errors, isSubmitting } = form.formState;
  const isEdit = account !== null;

  const submit = form.handleSubmit(async (values) => {
    const payload = toPayload(values);
    const result = isEdit
      ? await updateAccount({ ...payload, accountId: account.id })
      : await createAccount(payload);
    if (result.error !== undefined) {
      reportActionError(result.error, form.setError);
      return;
    }
    toast.success(isEdit ? MESSAGES.ACCOUNT.UPDATE_SUCCESS : MESSAGES.ACCOUNT.CREATE_SUCCESS);
    onClose();
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isEdit ? `Edit ${account.name}` : 'New account'}
          </DialogTitle>
          <DialogDescription>
            Passwords and secure notes are encrypted. Everyone who reveals them is recorded.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Belongs to</FieldLabel>
              <Controller
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <OwnerSelect
                    value={field.value}
                    onChange={field.onChange}
                    clients={clients}
                    isAdmin={isAdmin}
                  />
                )}
              />
            </Field>
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="account-name">Tool</FieldLabel>
              <Input
                id="account-name"
                placeholder="e.g. Circle"
                autoComplete="off"
                {...form.register('name', { required: 'Enter the tool or service name.' })}
              />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="account-purpose">What we use it for</FieldLabel>
              <Input id="account-purpose" autoComplete="off" {...form.register('purpose')} />
            </Field>
            <Field data-invalid={Boolean(errors.url)}>
              <FieldLabel htmlFor="account-url">Link</FieldLabel>
              <Input
                id="account-url"
                type="url"
                placeholder="https://"
                autoComplete="off"
                {...form.register('url')}
              />
              <FieldError errors={[errors.url]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="account-username">Login</FieldLabel>
              <Input
                id="account-username"
                placeholder="Email, username or 'Google sign in'"
                autoComplete="off"
                {...form.register('username')}
              />
            </Field>
            <Field>
              <FieldLabel>Access level</FieldLabel>
              <Controller
                control={form.control}
                name="accessLevel"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" aria-label="Access level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_ACCESS_LEVEL}>Not set</SelectItem>
                      {ACCESS_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {ACCESS_LEVEL_LABELS[level]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="account-2fa">Two-factor</FieldLabel>
              <Input
                id="account-2fa"
                placeholder="e.g. Authenticator on Jo's phone"
                autoComplete="off"
                {...form.register('twoFactor')}
              />
            </Field>
            <Field>
              <FieldLabel>Where the password lives</FieldLabel>
              <Controller
                control={form.control}
                name="storageLocation"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" aria-label="Where the password lives">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_LOCATION}>Not recorded</SelectItem>
                      {LOCATIONS.map((location) => (
                        <SelectItem key={location} value={location}>
                          {SECRET_LOCATION_LABELS[location]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="account-location-note">Location detail</FieldLabel>
              <Input
                id="account-location-note"
                placeholder="e.g. Bitwarden › The 30k Club"
                autoComplete="off"
                {...form.register('locationNote')}
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="account-secret">Password or API key</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="account-secret"
                  type={showSecret ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="font-figures"
                  placeholder={
                    isEdit && account.hasSecret ? 'Leave blank to keep the current one' : ''
                  }
                  {...form.register('secret')}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label={showSecret ? 'Hide' : 'Show'}
                    onClick={() => setShowSecret((current) => !current)}
                  >
                    {showSecret ? <EyeOff /> : <Eye />}
                  </InputGroupButton>
                  <InputGroupButton
                    size="icon-xs"
                    aria-label="Generate a strong password"
                    onClick={() => {
                      form.setValue('secret', generatePassword(), { shouldDirty: true });
                      setShowSecret(true);
                    }}
                  >
                    <RefreshCw />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="account-secure-notes">Secure notes</FieldLabel>
              <Textarea
                id="account-secure-notes"
                rows={3}
                placeholder={
                  isEdit && account.hasSecureNotes
                    ? 'Leave blank to keep the current notes'
                    : 'Recovery codes, security answers…'
                }
                {...form.register('secureNotes')}
              />
              <FieldDescription>Encrypted like the password.</FieldDescription>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="account-notes">Notes</FieldLabel>
              <Textarea
                id="account-notes"
                rows={2}
                placeholder="Anything else the team should know (not encrypted)"
                {...form.register('notes')}
              />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isEdit ? 'Save' : 'Add account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
