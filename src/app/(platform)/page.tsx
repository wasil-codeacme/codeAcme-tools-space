import type { CSSProperties } from 'react';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { HomeTimerStatus } from '@/components/platform/home-timer-status';
import { PageHeader } from '@/components/platform/page-header';
import { NextToolCard, ToolCard } from '@/components/platform/tool-card';
import { ToolGridSkeleton } from '@/components/platform/skeletons';
import { toolsForRole } from '@/config/tools';
import { Role } from '@/generated/prisma/enums';
import { ROUTES } from '@/lib/routes';
import { currentHour, formatDateKey, todayKey } from '@/lib/time-tracking/date-key';
import { formatDecimalHours, formatDuration } from '@/lib/time-tracking/duration';
import { requireUser } from '@/server/auth/guards';
import { getMyHoursSummary } from '@/server/services/time-tracking/my-hours.service';
import { getUserTimeZone } from '@/server/time-zone';

const MORNING_END_HOUR = 12;
const AFTERNOON_END_HOUR = 18;

function greetingFor(hour: number): string {
  if (hour < MORNING_END_HOUR) {
    return 'Good morning';
  }
  return hour < AFTERNOON_END_HOUR ? 'Good afternoon' : 'Good evening';
}

function HoursTile({ label, minutes, index }: { label: string; minutes: number; index: number }) {
  return (
    <Link
      href={ROUTES.TOOLS.TIME_TRACKING.ROOT}
      style={{ '--i': index } as CSSProperties}
      className="ca-reveal bg-card hover:border-primary/30 min-w-0 rounded-2xl border p-3 transition-colors duration-200 sm:p-4"
    >
      <p className="ca-eyebrow text-muted-foreground text-[0.65rem]">{label}</p>
      <p className="font-figures mt-1.5 truncate text-lg font-medium sm:text-2xl">
        {formatDuration(minutes)}
      </p>
      <p className="font-figures text-muted-foreground text-xs">{formatDecimalHours(minutes)} h</p>
    </Link>
  );
}

async function Dashboard() {
  const [user, timeZone] = await Promise.all([requireUser(), getUserTimeZone(), connection()]);
  const today = todayKey(timeZone);
  const hours = await getMyHoursSummary(user, today);
  const tools = toolsForRole(user.role);
  const firstName = user.name.split(' ')[0] ?? user.name;

  return (
    <>
      <PageHeader
        eyebrow={formatDateKey(today, 'EEEE, d MMMM')}
        title={`${greetingFor(currentHour(timeZone))}, ${firstName}`}
        description="Your hours at a glance, and every tool one click away."
      />

      <section aria-label="Today" className="mb-8 grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-4">
        <HoursTile label="Today" minutes={hours.todayMinutes} index={0} />
        <HoursTile label="This week" minutes={hours.weekMinutes} index={1} />
        <HoursTile label={formatDateKey(today, 'MMMM')} minutes={hours.monthMinutes} index={2} />
        <div className="ca-reveal col-span-3 lg:col-span-1" style={{ '--i': 3 } as CSSProperties}>
          <HomeTimerStatus userId={user.id} />
        </div>
      </section>

      <h2 className="ca-eyebrow text-muted-foreground mb-3">Tools</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool, index) => (
          <ToolCard
            key={tool.id}
            href={tool.href}
            name={tool.name}
            description={tool.description}
            icon={<tool.icon className="size-5" />}
            order={index}
          />
        ))}
        {user.role === Role.ADMIN && <NextToolCard order={tools.length} />}
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<ToolGridSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
