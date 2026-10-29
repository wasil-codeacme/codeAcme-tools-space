import type { SVGProps } from 'react';

// CodeAcme's own tool icons: rounded 24px line drawings in the current text colour, each with a
// soft tinted shape as its accent, so they read as one family on white, violet or muted surfaces.
// Sized like lucide icons (24×24 by default, overridden by size classes).

type IconProps = SVGProps<SVGSVGElement>;

const ACCENT_OPACITY = 0.16;

function IconFrame({ children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

// A ledger page with a clock tucked into its corner.
export function TimeTrackingIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M13 20H6.5A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4h8A2.5 2.5 0 0 1 17 6.5V9" />
      <path d="M8 8.5h5M8 12h3" />
      <circle cx="16.5" cy="16" r="4.5" fill="currentColor" fillOpacity={ACCENT_OPACITY} />
      <path d="M16.5 14v2l1.3 1.1" />
    </IconFrame>
  );
}

// A vault shield with a keyhole.
export function AccountsIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M12 3.5 5 6.2v5.3c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6.2Z"
        fill="currentColor"
        fillOpacity={ACCENT_OPACITY}
      />
      <circle cx="12" cy="10.5" r="2" />
      <path d="M12 12.5v3" />
    </IconFrame>
  );
}

// A stopwatch whose ring is part filled, like the Work Timer's focus ring.
export function WorkTimerIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M10 2.5h4M12 2.5v2.5M18.5 6.5 20 5" />
      <circle cx="12" cy="13.5" r="7.5" />
      <path
        d="M12 13.5V8.6a4.9 4.9 0 1 1-4.6 6.5Z"
        fill="currentColor"
        fillOpacity={ACCENT_OPACITY}
        stroke="none"
      />
      <path d="M12 8.6v4.9l3 1.7" />
    </IconFrame>
  );
}

// A project folder holding an invoice, with a coin for billing.
export function ProjectsIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M3.5 8V6.5A2 2 0 0 1 5.5 4.5h3.2l1.8 2h8a2 2 0 0 1 2 2V10" />
      <path d="M3.5 8.5h11.2a2 2 0 0 1 2 2.3l-.25 1.5" />
      <path d="M3.5 8.5v9a2 2 0 0 0 2 2h6" />
      <circle cx="17.5" cy="17" r="3.5" fill="currentColor" fillOpacity={ACCENT_OPACITY} />
      <path d="M17.5 15.6v2.8" />
    </IconFrame>
  );
}
