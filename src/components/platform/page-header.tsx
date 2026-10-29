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
          <p className="ca-eyebrow text-primary flex items-center gap-2.5 text-[0.7rem]">
            <span aria-hidden className="h-0.5 w-[18px] bg-current opacity-50" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-[-0.025em] text-balance">{title}</h1>
        {description && (
          <p className="text-muted-foreground max-w-2xl text-sm text-pretty">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
