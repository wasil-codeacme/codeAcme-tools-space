import { connection } from 'next/server';
import { Suspense } from 'react';
import { PageHeader } from '@/components/platform/page-header';
import { NextToolCard, ToolCard } from '@/components/platform/tool-card';
import { ToolGridSkeleton } from '@/components/platform/skeletons';
import { toolsForUser } from '@/config/tools';
import { Role } from '@/generated/prisma/enums';
import { currentHour, formatDateKey, todayKey } from '@/lib/time-tracking/date-key';
import { requireUser } from '@/server/auth/guards';
import { getUserTimeZone } from '@/server/time-zone';

const MORNING_END_HOUR = 12;
const AFTERNOON_END_HOUR = 18;

function greetingFor(hour: number): string {
  if (hour < MORNING_END_HOUR) {
    return 'Good morning';
  }
  return hour < AFTERNOON_END_HOUR ? 'Good afternoon' : 'Good evening';
}

async function Dashboard() {
  const [user, timeZone] = await Promise.all([requireUser(), getUserTimeZone(), connection()]);
  const today = todayKey(timeZone);
  const tools = toolsForUser(user);
  const firstName = user.name.split(' ')[0] ?? user.name;

  return (
    <>
      <PageHeader
        eyebrow={formatDateKey(today, 'EEEE, d MMMM')}
        title={`${greetingFor(currentHour(timeZone))}, ${firstName}`}
        description="Pick a tool to get started."
      />
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
