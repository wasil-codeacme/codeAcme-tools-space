import { readFileSync } from 'node:fs';
import path from 'node:path';

// Read once at module load: the logo never changes between requests, and a synchronous read keeps
// these image routes prerenderable under Cache Components.
const LOGO_MARK_DATA_URI = `data:image/png;base64,${readFileSync(
  path.join(process.cwd(), 'public/brand/codeacme-logo-mark.png'),
).toString('base64')}`;

// Logo mark aspect ratio (211 × 126 px source).
const LOGO_ASPECT = 126 / 211;

export const BRAND_COLORS = {
  violet: '#5911EB',
  paper: '#FFFFFF',
  ink: '#0C0B13',
  muted: '#6D6A7C',
  dot: 'rgba(89, 17, 235, 0.08)',
} as const;

export function LogoMark({ width }: { width: number }) {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- rendered by Satori, not the browser
  return <img src={LOGO_MARK_DATA_URI} width={width} height={Math.round(width * LOGO_ASPECT)} />;
}

export function IconTile({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFFFFF',
        borderRadius: size * 0.22,
      }}
    >
      <LogoMark width={Math.round(size * 0.82)} />
    </div>
  );
}
