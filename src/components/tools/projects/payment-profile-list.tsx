'use client';

import { useTransition } from 'react';
import { ExternalLink, Pencil, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentProfileDialog } from '@/components/tools/projects/payment-profile-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { reportActionError } from '@/lib/action-feedback';
import { MESSAGES } from '@/lib/messages';
import { deletePaymentProfile } from '@/server/actions/projects/projects.actions';
import type { PaymentProfileView } from '@/types/projects';

function DeleteProfileButton({ profile }: { profile: PaymentProfileView }) {
  const [isPending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isPending}>
          <Trash2 />
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {profile.label}?</AlertDialogTitle>
          <AlertDialogDescription>
            Invoices already created keep their copy of these details.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              startTransition(async () => {
                const result = await deletePaymentProfile({ id: profile.id });
                if (result.error !== undefined) {
                  reportActionError(result.error);
                  return;
                }
                toast.success(MESSAGES.PAYMENT_PROFILE.DELETE_SUCCESS);
              })
            }
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function PaymentProfileList({ profiles }: { profiles: PaymentProfileView[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {profiles.map((profile) => (
        <li key={profile.id} className="ca-glow bg-card flex flex-col gap-3 rounded-2xl border p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">{profile.label}</h2>
            {profile.isFavorite && (
              <span className="bg-accent text-accent-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
                <Star className="size-3 fill-current" />
                Favourite
              </span>
            )}
          </div>
          <pre className="bg-muted/60 text-muted-foreground rounded-xl p-3 font-sans text-sm whitespace-pre-wrap">
            {profile.details}
          </pre>
          {profile.paymentLink && (
            <a
              href={profile.paymentLink}
              target="_blank"
              rel="noreferrer"
              className="text-primary inline-flex items-center gap-1 text-sm break-all"
            >
              {profile.paymentLink}
              <ExternalLink className="size-3.5 shrink-0" />
            </a>
          )}
          <div className="mt-auto flex justify-end gap-1">
            <PaymentProfileDialog
              profile={profile}
              trigger={
                <Button variant="ghost" size="sm">
                  <Pencil />
                  Edit
                </Button>
              }
            />
            <DeleteProfileButton profile={profile} />
          </div>
        </li>
      ))}
    </ul>
  );
}
