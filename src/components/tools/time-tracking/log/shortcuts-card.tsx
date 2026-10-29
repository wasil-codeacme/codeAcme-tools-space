import { Keyboard } from 'lucide-react';
import { Kbd } from '@/components/ui/kbd';

const SHORTCUTS = [
  { keys: ['N'], label: 'New item' },
  { keys: ['←', '→'], label: 'Previous / next day' },
  { keys: ['T'], label: 'Jump to today' },
  { keys: ['P'], label: 'Paste from notes' },
  { keys: ['Esc'], label: 'Cancel editing' },
] as const;

export function ShortcutsCard() {
  return (
    <div className="ca-glow bg-card hidden rounded-2xl border p-5 lg:block">
      <p className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Keyboard className="text-muted-foreground size-4" />
        Shortcuts
      </p>
      <dl className="space-y-2">
        {SHORTCUTS.map((shortcut) => (
          <div key={shortcut.label} className="flex items-center justify-between gap-3 text-sm">
            <dt className="text-muted-foreground">{shortcut.label}</dt>
            <dd className="flex gap-1">
              {shortcut.keys.map((key) => (
                <Kbd key={key}>{key}</Kbd>
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-muted-foreground mt-4 text-xs">
        Durations understand <span className="font-figures">30m</span>,{' '}
        <span className="font-figures">1h 10m</span>, <span className="font-figures">1:10</span> and{' '}
        <span className="font-figures">1.5h</span>.
      </p>
    </div>
  );
}
