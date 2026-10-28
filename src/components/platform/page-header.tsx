import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pt-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        {eyebrow && (
          <p className="font-figures text-muted-foreground text-[0.7rem] tracking-[0.18em] uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">{title}</h1>
        {description && (
          <p className="text-muted-foreground max-w-2xl text-sm text-pretty">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
