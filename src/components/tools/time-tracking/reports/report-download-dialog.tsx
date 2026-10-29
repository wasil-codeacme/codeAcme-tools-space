'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarRange, Download, FileDown, FileSpreadsheet } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { MAX_PREPARED_BY_LENGTH } from '@/lib/constants';
import { ROUTES } from '@/lib/routes';
import { type DateKey, formatDateKey, fromDateKey } from '@/lib/time-tracking/date-key';
import { getMonthWeeks } from '@/lib/time-tracking/month-weeks';
import { ReportPeriod } from '@/lib/time-tracking/report-period';
import { ReportBranding, ReportFormat } from '@/server/validators/time-tracking/time-report.schema';

const Scope = {
  SHOWN: 'shown',
  THIS_WEEK: 'this-week',
  THIS_MONTH: 'this-month',
  WEEK_OF_MONTH: 'week-of-month',
  RANGE: 'range',
} as const;
type Scope = (typeof Scope)[keyof typeof Scope];

const SCOPE_LABELS: Record<Scope, string> = {
  shown: 'As previewed',
  'this-week': 'This week',
  'this-month': 'This month',
  'week-of-month': 'One week',
  range: 'Any dates',
};

const PICKER_DATE_FORMAT = 'yyyy-MM-dd';
const SELECTED_TOGGLE = 'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground';

interface ReportPeriodChoice {
  period: ReportPeriod;
  date: DateKey;
  to?: DateKey;
}

interface ReportDownloadDialogProps {
  clientId: string;
  clientName: string;
  today: DateKey;
  shown: ReportPeriodChoice & { label: string };
  branding: ReportBranding;
  defaultPreparedBy: string;
}

function toDateKey(day: Date): DateKey {
  return format(day, PICKER_DATE_FORMAT);
}

function isScope(value: string): value is Scope {
  return (Object.values(Scope) as string[]).includes(value);
}

export function ReportDownloadDialog({
  clientId,
  clientName,
  today,
  shown,
  branding: initialBranding,
  defaultPreparedBy,
}: ReportDownloadDialogProps) {
  const weeks = getMonthWeeks(shown.date);
  const [scope, setScope] = useState<Scope>(Scope.SHOWN);
  const [weekIndex, setWeekIndex] = useState(String(weeks[0]?.index ?? 1));
  const [range, setRange] = useState<DateRange | undefined>();
  const [branding, setBranding] = useState<ReportBranding>(initialBranding);
  const [preparedBy, setPreparedBy] = useState(defaultPreparedBy);

  function choice(): ReportPeriodChoice | null {
    switch (scope) {
      case Scope.THIS_WEEK:
        return { period: ReportPeriod.WEEK, date: today };
      case Scope.THIS_MONTH:
        return { period: ReportPeriod.MONTH, date: today };
      case Scope.WEEK_OF_MONTH: {
        const week = weeks.find((item) => String(item.index) === weekIndex);
        return week ? { period: ReportPeriod.RANGE, date: week.startKey, to: week.endKey } : null;
      }
      case Scope.RANGE:
        return range?.from
          ? {
              period: ReportPeriod.RANGE,
              date: toDateKey(range.from),
              to: toDateKey(range.to ?? range.from),
            }
          : null;
      default:
        return { period: shown.period, date: shown.date, to: shown.to };
    }
  }

  function exportHref(reportFormat: ReportFormat): string | null {
    const selected = choice();
    if (!selected) {
      return null;
    }
    const params = new URLSearchParams({
      clientId,
      period: selected.period,
      date: selected.date,
      branding,
      format: reportFormat,
    });
    if (selected.to) {
      params.set('to', selected.to);
    }
    if (preparedBy.trim()) {
      params.set('preparedBy', preparedBy.trim());
    }
    return `${ROUTES.API.TIME_TRACKING.REPORT_EXPORT}?${params.toString()}`;
  }

  const pdfHref = exportHref(ReportFormat.PDF);
  const csvHref = exportHref(ReportFormat.CSV);
  const rangeLabel = range?.from
    ? `${format(range.from, 'd MMM yyyy')}${range.to ? ` – ${format(range.to, 'd MMM yyyy')}` : ''}`
    : 'Pick the first and last day';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Download />
          Download report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Download {clientName} report</DialogTitle>
          <DialogDescription>
            Choose the dates, branding and whose name goes on the report.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>Dates</FieldLabel>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={scope}
              onValueChange={(value) => isScope(value) && setScope(value)}
              className="flex flex-wrap justify-start"
              aria-label="Dates"
            >
              {Object.values(Scope).map((value) => (
                <ToggleGroupItem key={value} value={value} className={SELECTED_TOGGLE}>
                  {SCOPE_LABELS[value]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {scope === Scope.SHOWN && <FieldDescription>{shown.label}</FieldDescription>}
            {scope === Scope.THIS_WEEK && (
              <FieldDescription>
                Monday to Sunday, the week of {formatDateKey(today, 'd MMM')}.
              </FieldDescription>
            )}
            {scope === Scope.THIS_MONTH && (
              <FieldDescription>
                {formatDateKey(today, 'MMMM yyyy')}, with a week-by-week breakdown.
              </FieldDescription>
            )}
            {scope === Scope.WEEK_OF_MONTH && (
              <Select value={weekIndex} onValueChange={setWeekIndex}>
                <SelectTrigger className="w-full" aria-label="Week">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weeks.map((week) => (
                    <SelectItem key={week.index} value={String(week.index)}>
                      Week {week.index} · {week.rangeLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {scope === Scope.RANGE && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarRange className="text-muted-foreground" />
                    {rangeLabel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={range}
                    onSelect={setRange}
                    defaultMonth={range?.from ?? fromDateKey(shown.date)}
                    numberOfMonths={1}
                  />
                </PopoverContent>
              </Popover>
            )}
          </Field>
          <Field>
            <FieldLabel>Branding</FieldLabel>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={branding}
              onValueChange={(value) => value && setBranding(value as ReportBranding)}
              className="justify-start"
              aria-label="Branding"
            >
              <ToggleGroupItem value={ReportBranding.CODEACME} className={SELECTED_TOGGLE}>
                CodeAcme branding
              </ToggleGroupItem>
              <ToggleGroupItem value={ReportBranding.NONE} className={SELECTED_TOGGLE}>
                Unbranded
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="prepared-by">Prepared by</FieldLabel>
            <Input
              id="prepared-by"
              value={preparedBy}
              maxLength={MAX_PREPARED_BY_LENGTH}
              placeholder="e.g. Muhammad Ahmed Fraz"
              onChange={(event) => setPreparedBy(event.target.value)}
            />
            <FieldDescription>Shown on the PDF. Leave empty to name nobody.</FieldDescription>
          </Field>
        </FieldGroup>
        <DialogFooter className="gap-2">
          <DownloadLink
            href={csvHref}
            variant="outline"
            icon={<FileSpreadsheet />}
            label="Download CSV"
          />
          <DownloadLink href={pdfHref} icon={<FileDown />} label="Download PDF" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DownloadLink({
  href,
  label,
  icon,
  variant = 'default',
}: {
  href: string | null;
  label: string;
  icon: React.ReactNode;
  variant?: 'default' | 'outline';
}) {
  if (!href) {
    return (
      <Button variant={variant} disabled>
        {icon}
        {label}
      </Button>
    );
  }
  return (
    <Button asChild variant={variant}>
      <a href={href} download>
        {icon}
        {label}
      </a>
    </Button>
  );
}
