'use client';

import { useEffect } from 'react';

const GLOW_SELECTOR = '.ca-glow';

// Feeds the pointer position to every `.ca-glow` card as --glow-x / --glow-y (relative to the
// card), so the spotlight and border glow follow the cursor, and nearby cards light up at the
// edge closest to it. One listener for the whole page, batched to one update per frame.
export function GlowTracker() {
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) {
      return;
    }
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const update = () => {
      frame = 0;
      for (const card of document.querySelectorAll<HTMLElement>(GLOW_SELECTOR)) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--glow-x', `${pointerX - rect.left}px`);
        card.style.setProperty('--glow-y', `${pointerY - rect.top}px`);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
