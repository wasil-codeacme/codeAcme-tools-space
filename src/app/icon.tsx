import { ImageResponse } from 'next/og';
import { IconTile } from '@/lib/brand/brand-images';

const ICON_SIZE = 64;

export const size = { width: ICON_SIZE, height: ICON_SIZE };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(<IconTile size={ICON_SIZE} />, size);
}
