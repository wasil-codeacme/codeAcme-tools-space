'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const TIME_FORMAT = 'HH:mm';

interface DateTimePickerProps {
  id: string;
  label: string;
  value: Date;
  onChange: (value: Date) => void;
}

function withTime(date: Date, time: string): Date {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

// shadcn's date-and-time recipe: a calendar popover for the day and a time field beside it, both in
// the browser's local time.
export function DateTimePicker({ id, label, value, onChange }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className="flex-1 justify-start font-normal"
            aria-label={`${label} date`}
          >
            <CalendarIcon className="text-muted-foreground" />
            {format(value, 'EEE d MMM yyyy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            defaultMonth={value}
            onSelect={(day) => {
              if (day) {
                onChange(withTime(day, format(value, TIME_FORMAT)));
                setIsOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        aria-label={`${label} time`}
        value={format(value, TIME_FORMAT)}
        onChange={(event) => event.target.value && onChange(withTime(value, event.target.value))}
        className="font-figures w-28 [&::-webkit-calendar-picker-indicator]:hidden"
      />
    </div>
  );
}
