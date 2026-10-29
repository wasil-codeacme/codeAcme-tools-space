'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Pause, PictureInPicture2, Play, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkTimer } from '@/hooks/use-work-timer';
import { formatElapsed } from '@/lib/work-timer/format-elapsed';
import { cn } from '@/lib/utils';

// Chrome and Edge can open an always-on-top mini window (Document Picture-in-Picture), so the timer
// floats over other apps. Other browsers get the same mini timer as an overlay inside the app.
interface DocumentPictureInPicture {
  requestWindow(options: { width: number; height: number }): Promise<Window>;
}

const POP_OUT_SIZE = { width: 300, height: 156 } as const;

type PopOutMode = 'closed' | 'window' | 'overlay';

let mode: PopOutMode = 'closed';
const listeners = new Set<() => void>();

function setMode(next: PopOutMode) {
  mode = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function pictureInPicture(): DocumentPictureInPicture | null {
  const candidate = (window as Window & { documentPictureInPicture?: DocumentPictureInPicture })
    .documentPictureInPicture;
  return candidate ?? null;
}

export function openTimerPopOut() {
  setMode(pictureInPicture() ? 'window' : 'overlay');
}

// The mini window starts empty, so the app's styles and fonts are copied across.
function copyStyles(target: Window) {
  // The mini window is about:blank, so relative font and asset URLs need the app's origin.
  const base = target.document.createElement('base');
  base.href = window.location.origin;
  target.document.head.appendChild(base);
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const style = target.document.createElement('style');
      style.textContent = Array.from(sheet.cssRules)
        .map((rule) => rule.cssText)
        .join('\n');
      target.document.head.appendChild(style);
    } catch {
      if (sheet.href) {
        const link = target.document.createElement('link');
        link.rel = 'stylesheet';
        link.href = sheet.href;
        target.document.head.appendChild(link);
      }
    }
  }
  // Fonts already loaded in the app are handed over directly, so the window shows them at once.
  document.fonts.forEach((font) => target.document.fonts.add(font));
  target.document.documentElement.className = document.documentElement.className;
  target.document.body.className = 'bg-background text-foreground antialiased';
}

function MiniTimer({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { timer, paused, elapsedSeconds, togglePause, stop } = useWorkTimer(userId);
  return (
    <div className="bg-card flex h-full flex-col justify-between gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="ca-eyebrow text-primary flex items-center gap-2 text-[0.65rem]">
          <span
            className={cn(
              'size-2 rounded-full',
              !timer && 'bg-muted-foreground/40',
              timer && paused && 'bg-amber-500',
              timer && !paused && 'bg-emerald-500 motion-safe:animate-pulse',
            )}
          />
          {!timer ? 'No timer running' : paused ? 'Paused' : 'Working'}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close mini timer"
          className="text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
      <div>
        <p
          className={cn(
            'font-figures text-3xl leading-none font-medium tabular-nums transition-opacity',
            paused && 'opacity-50',
          )}
        >
          {formatElapsed(elapsedSeconds)}
        </p>
        <p className="text-muted-foreground mt-1 truncate text-xs">
          {timer ? timer.label : 'Start one on the Work Timer page.'}
        </p>
      </div>
      {timer && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant={paused ? 'default' : 'secondary'}
            className="rounded-full"
            onClick={togglePause}
          >
            {paused ? <Play className="fill-current" /> : <Pause className="fill-current" />}
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button size="sm" className="rounded-full" onClick={() => void stop()}>
            <Square className="fill-current" />
            Stop
          </Button>
        </div>
      )}
    </div>
  );
}

// Mounted once per signed-in page; renders the mini timer wherever it is currently popped out.
export function TimerPopOutHost({ userId }: { userId: string }) {
  const currentMode = useSyncExternalStore(
    subscribe,
    () => mode,
    (): PopOutMode => 'closed',
  );
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  useEffect(() => {
    const pip = pictureInPicture();
    if (currentMode !== 'window' || !pip) {
      return;
    }
    let cancelled = false;
    let opened: Window | null = null;
    const onClosed = () => setMode('closed');
    pip
      .requestWindow(POP_OUT_SIZE)
      .then((window) => {
        if (cancelled) {
          window.close();
          return;
        }
        opened = window;
        copyStyles(window);
        window.addEventListener('pagehide', onClosed);
        setPipWindow(window);
      })
      // The browser can refuse (e.g. no user gesture); the in-app overlay still works.
      .catch(() => setMode('overlay'));
    return () => {
      cancelled = true;
      opened?.removeEventListener('pagehide', onClosed);
      opened?.close();
      setPipWindow(null);
    };
  }, [currentMode]);

  const close = () => setMode('closed');
  if (currentMode === 'window' && pipWindow) {
    return createPortal(<MiniTimer userId={userId} onClose={close} />, pipWindow.document.body);
  }
  if (currentMode === 'overlay') {
    // Rendered on the body: the top bar's backdrop blur would otherwise pin a fixed element to it.
    return createPortal(
      <div className="animate-in fade-in slide-in-from-bottom-2 fixed right-4 bottom-20 z-50 w-72 overflow-hidden rounded-2xl border shadow-2xl duration-300 md:bottom-6">
        <MiniTimer userId={userId} onClose={close} />
      </div>,
      document.body,
    );
  }
  return null;
}

export function TimerPopOutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openTimerPopOut}
      aria-label="Pop out the timer"
      title="Pop out the timer"
      className={cn(
        'flex size-7 items-center justify-center rounded-full transition-colors duration-150',
        className,
      )}
    >
      <PictureInPicture2 className="size-3.5" />
    </button>
  );
}
