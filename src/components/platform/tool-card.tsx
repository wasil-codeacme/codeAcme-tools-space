import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Plus } from 'lucide-react';

const STAGGER_MS = 70;

function staggerStyle(order: number): CSSProperties {
  return { animationDelay: `${order * STAGGER_MS}ms` };
}

interface ToolCardProps {
  href: string;
  name: string;
  description: string;
  icon: ReactNode;
  order: number;
}

export function ToolCard({ href, name, description, icon, order }: ToolCardProps) {
  return (
    <Link
      href={href}
      style={staggerStyle(order)}
      className="group ca-glow bg-card hover:border-primary/30 focus-visible:ring-ring/50 motion-safe:animate-in motion-safe:fill-mode-both motion-safe:fade-in motion-safe:slide-in-from-bottom-2 relative flex min-h-48 flex-col justify-between overflow-hidden rounded-2xl border p-5 shadow-[0_1px_0_0_var(--border)] transition-[transform,box-shadow,border-color] duration-300 ease-(--ease-out-quint) outline-none hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_color-mix(in_oklch,var(--primary)_35%,transparent)] focus-visible:ring-3 motion-safe:duration-500"
    >
      <div className="flex items-start justify-between">
        <span className="bg-accent text-accent-foreground ring-primary/10 flex size-11 items-center justify-center rounded-xl ring-1">
          {icon}
        </span>
        <ArrowUpRight className="text-muted-foreground group-hover:text-foreground size-4 transition-transform duration-300 ease-(--ease-out-quint) group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
      <div className="space-y-1.5">
        <h2 className="font-heading text-lg font-semibold tracking-tight">{name}</h2>
        <p className="text-muted-foreground text-sm text-pretty">{description}</p>
      </div>
    </Link>
  );
}

export function NextToolCard({ order }: { order: number }) {
  return (
    <div
      style={staggerStyle(order)}
      className="text-muted-foreground motion-safe:animate-in motion-safe:fill-mode-both motion-safe:fade-in flex min-h-48 flex-col justify-between rounded-2xl border border-dashed p-5 motion-safe:duration-500"
    >
      <span className="flex size-11 items-center justify-center rounded-xl border border-dashed">
        <Plus className="size-5" />
      </span>
      <div className="space-y-1.5">
        <h2 className="font-heading text-foreground/70 text-lg font-semibold tracking-tight">
          Next tool
        </h2>
        <p className="text-sm text-pretty">
          Hour calculator, inventory or anything else: tools are added in code and appear here
          automatically. See <code className="font-figures text-xs">docs/adding-a-tool.md</code>.
        </p>
      </div>
    </div>
  );
}
