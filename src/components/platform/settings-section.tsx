import type { ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="ca-glow bg-card grid gap-4 rounded-2xl border p-5 md:grid-cols-[240px_minmax(0,1fr)] md:gap-8 md:p-6">
      <div className="space-y-1">
        <h2 className="font-heading text-base font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
