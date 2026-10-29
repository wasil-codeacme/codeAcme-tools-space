import 'server-only';
import { logger } from '@/lib/logger';

// Incidental work (notification emails) must never fail the operation that triggered it: failures
// are logged and swallowed.
export async function runSideEffect(name: string, effect: () => Promise<unknown>): Promise<void> {
  try {
    await effect();
  } catch (error) {
    logger.error({ err: error, sideEffect: name }, 'Side effect failed');
  }
}
