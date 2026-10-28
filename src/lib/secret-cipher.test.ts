import { describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret } from '@/lib/secret-cipher';

describe('secret cipher', () => {
  it('round-trips a secret, including unicode', () => {
    const secret = 'p@ss wörd 🔑';
    expect(decryptSecret(encryptSecret(secret))).toBe(secret);
  });

  it('never stores the plaintext and uses a fresh IV every time', () => {
    const first = encryptSecret('hunter22');
    expect(first).not.toContain('hunter22');
    expect(first).not.toBe(encryptSecret('hunter22'));
  });

  it('rejects a tampered ciphertext', () => {
    const [version, iv, tag, data] = encryptSecret('hunter22').split('.');
    const flipped = `${data?.[0] === 'A' ? 'B' : 'A'}${data?.slice(1)}`;
    expect(() => decryptSecret([version, iv, tag, flipped].join('.'))).toThrow();
  });

  it('rejects unknown formats', () => {
    expect(() => decryptSecret('plaintext')).toThrow('Unsupported secret format');
  });
});
