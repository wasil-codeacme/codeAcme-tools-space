import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/password';

describe('password hashing', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const stored = await hashPassword('correct-horse-battery');
    expect(await verifyPassword('correct-horse-battery', stored)).toBe(true);
    expect(await verifyPassword('wrong-horse-battery', stored)).toBe(false);
  });

  it('salts every hash', async () => {
    expect(await hashPassword('same-password-twice')).not.toBe(
      await hashPassword('same-password-twice'),
    );
  });

  it('rejects stored values in an unknown format', async () => {
    expect(await verifyPassword('anything', 'bcrypt$abc$def')).toBe(false);
    expect(await verifyPassword('anything', '')).toBe(false);
  });
});
