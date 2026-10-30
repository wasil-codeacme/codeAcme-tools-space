'use client';

import { format } from 'date-fns';
import { Building2, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { ReportDownloadDialog } from '@/components/tools/time-tracking/reports/report-download-dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { useSearchParamNavigation } from '@/hooks/use-search-param-navigation';
import { MAX_PREPARED_BY_LENGTH } from '@/lib/constants';
import { type DateKey, fromDateKey } from '@/lib/time-tracking/date-key';
import {
  REPORT_PERIOD_LABELS,
  ReportPeriod,
  shiftPeriodAnchor,
} from '@/lib/time-tracking/report-period';
import {
  ReportBranding,
  type ReportQuery,
} from '@/server/validators/time-tracking/time-report.schema';

interface ReportFiltersProps {
  clients: { id: string; name: string }[];
  query: ReportQuery;
  periodLabel: string;
  today: DateKey;
  preparedBy: string;
  profileName: string;
}

const PERIODS = [ReportPeriod.WEEK, ReportPeriod.TWO_WEEKS, ReportPeriod.MONTH] as const;
const PICKER_DATE_FORMAT = 'yyyy-MM-dd';
const SELECTED_TOGGLE = 'px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground';

function isPeriod(value: string): value is ReportPeriod {
  return (PERIODS as readonly string[]).includes(value);
}

export function ReportFilters({
  clients,
  query,
  periodLabel,
  today,
  preparedBy,
  profileName,
}: ReportFiltersProps) {
  const { navigate } = useSearchParamNavigation();
  const selectedDate = fromDateKey(query.date);
  // The picker works in local calendar days; DateKeys are calendar days too, so copy the parts over.
  const pickerDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
  );

  // A blank box, or the profile name itself, keeps the URL clean and uses the profile name.
  function commitPreparedBy(value: string) {
    const name = value.trim();
    if (name !== preparedBy) {
      navigate({ preparedBy: name && name !== profileName ? name : null });
    }
  }

  return (
    <div className="ca-glow bg-card space-y-3 rounded-2xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={query.clientId} onValueChange={(clientId) => navigate({ clientId })}>
          <SelectTrigger className="min-w-56 font-medium" aria-label="Client">
            <Building2 className="text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToggleGroup
          type="single"
          variant="outline"
          value={query.period}
          onValueChange={(period) => isPeriod(period) && navigate({ period })}
          aria-label="Report period"
        >
          {PERIODS.map((period) => (
            <ToggleGroupItem key={period} value={period} className={SELECTED_TOGGLE}>
              {REPORT_PERIOD_LABELS[period]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous period"
            onClick={() => navigate({ date: shiftPeriodAnchor(query.period, query.date, -1) })}
          >
            <ChevronLeft />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="min-w-44 font-medium">
                <CalendarDays className="text-muted-foreground" />
                {periodLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={pickerDate}
                defaultMonth={pickerDate}
                weekStartsOn={1}
                onSelect={(date) => date && navigate({ date: format(date, PICKER_DATE_FORMAT) })}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next period"
            onClick={() => navigate({ date: shiftPeriodAnchor(query.period, query.date, 1) })}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={query.branding}
          onValueChange={(branding) => branding && navigate({ branding })}
          aria-label="Branding"
        >
          <ToggleGroupItem value={ReportBranding.CODEACME} className={SELECTED_TOGGLE}>
            CodeAcme branding
          </ToggleGroupItem>
          <ToggleGroupItem value={ReportBranding.NONE} className={SELECTED_TOGGLE}>
            Unbranded
          </ToggleGroupItem>
        </ToggleGroup>
        <label className="flex min-w-56 flex-1 items-center gap-2 text-sm sm:max-w-sm">
          <span className="text-muted-foreground whitespace-nowrap">Prepared by</span>
          <Input
            key={preparedBy}
            defaultValue={preparedBy}
            placeholder={profileName}
            maxLength={MAX_PREPARED_BY_LENGTH}
            onBlur={(event) => commitPreparedBy(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
          />
        </label>
        <ReportDownloadDialog
          key={`${query.clientId}:${query.period}:${query.date}:${query.to ?? ''}:${preparedBy}`}
          clientId={query.clientId}
          clientName={clients.find((client) => client.id === query.clientId)?.name ?? 'client'}
          today={today}
          shown={{ period: query.period, date: query.date, to: query.to, label: periodLabel }}
          branding={query.branding}
          defaultPreparedBy={preparedBy}
        />
      </div>
    </div>
  );
}
