'use client';

import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export default function PlatformError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Empty className="mt-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TriangleAlert />
        </EmptyMedia>
        <EmptyTitle>Something went wrong</EmptyTitle>
        <EmptyDescription>
          This page could not be loaded. Try again, and if it keeps happening let an admin know.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={reset}>
          <RotateCcw />
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  );
}
