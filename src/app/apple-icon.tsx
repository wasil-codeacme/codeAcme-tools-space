import { ImageResponse } from 'next/og';
import { IconTile } from '@/lib/brand/brand-images';

const APPLE_ICON_SIZE = 180;

export const size = { width: APPLE_ICON_SIZE, height: APPLE_ICON_SIZE };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(<IconTile size={APPLE_ICON_SIZE} />, size);
}
