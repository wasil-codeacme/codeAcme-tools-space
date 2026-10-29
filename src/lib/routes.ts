const TIME_TRACKING_ROOT = '/tools/time-tracking';
const ACCOUNTS_ROOT = '/tools/accounts';
const WORK_TIMER_ROOT = '/tools/work-timer';

export const ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/login',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
  },
  ACCOUNT: '/account',
  ADMIN: {
    TEAM: '/admin/team',
  },
  TOOLS: {
    TIME_TRACKING: {
      ROOT: TIME_TRACKING_ROOT,
      OVERVIEW: `${TIME_TRACKING_ROOT}/overview`,
      CLIENTS: `${TIME_TRACKING_ROOT}/clients`,
      CLIENT: (clientId: string) => `${TIME_TRACKING_ROOT}/clients/${clientId}`,
      REPORTS: `${TIME_TRACKING_ROOT}/reports`,
    },
    ACCOUNTS: {
      ROOT: ACCOUNTS_ROOT,
      ACTIVITY: `${ACCOUNTS_ROOT}/activity`,
    },
    WORK_TIMER: {
      ROOT: WORK_TIMER_ROOT,
    },
  },
  API: {
    HEALTH: '/api/health',
    TIME_TRACKING: {
      REPORT_EXPORT: '/api/tools/time-tracking/reports/export',
    },
  },
} as const;

// Paths the proxy lets through without a session.
export const PUBLIC_PATHS: readonly string[] = [
  ROUTES.AUTH.LOGIN,
  ROUTES.AUTH.FORGOT_PASSWORD,
  ROUTES.AUTH.RESET_PASSWORD,
  ROUTES.API.HEALTH,
];
