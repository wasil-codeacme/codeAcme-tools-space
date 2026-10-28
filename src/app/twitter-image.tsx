import { ImageResponse } from 'next/og';
import { SITE } from '@/config/site';
import { BRAND_COLORS, LogoMark } from '@/lib/brand/brand-images';

const WIDTH = 1200;
const HEIGHT = 630;
const TOOL_NAMES = ['Time Tracking', 'Accounts & Secrets', 'Work Timer'];

export const alt = `${SITE.NAME}: internal tools for the CodeAcme team`;
export const size = { width: WIDTH, height: HEIGHT };
export const contentType = 'image/png';

export default function TwitterImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: BRAND_COLORS.paper,
        backgroundImage: `radial-gradient(${BRAND_COLORS.dot} 2px, transparent 2px)`,
        backgroundSize: '28px 28px',
        color: BRAND_COLORS.ink,
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <LogoMark width={120} />
        <span style={{ fontSize: 34, fontWeight: 700 }}>{SITE.COMPANY}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <span style={{ fontSize: 92, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>
          {SITE.NAME}
        </span>
        <span style={{ fontSize: 40, color: BRAND_COLORS.muted }}>
          Every hour, account and session, in one place.
        </span>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {TOOL_NAMES.map((name) => (
          <span
            key={name}
            style={{
              display: 'flex',
              padding: '12px 26px',
              borderRadius: 999,
              background: BRAND_COLORS.violet,
              color: '#FFFFFF',
              fontSize: 28,
              fontWeight: 600,
            }}
          >
            {name}
          </span>
        ))}
      </div>
    </div>,
    size,
  );
}
