const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const GENERATED_PASSWORD_LENGTH = 16;

// Temporary passwords an admin hands to a new team member; ambiguous characters (0/O, 1/l) are left out.
export function generatePassword(length = GENERATED_PASSWORD_LENGTH): string {
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (value) => PASSWORD_ALPHABET[value % PASSWORD_ALPHABET.length]).join('');
}
