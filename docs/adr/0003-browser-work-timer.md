# ADR 0003: The Work Timer runs in the browser and is saved on Stop

- Status: Accepted
- Date: 2026-10-28

## Context

The first Work Timer stored a running session on the server: Start and Stop were server round trips,
and the elapsed time compared the device clock with the server's start time. On the live site Start
felt slow, and a device clock that was behind the server held the display at 00:00:00. The team also
wanted to pause for breaks.

## Decision

- Start, Pause and Resume happen only in the browser. The running timer (start moment, worked time so
  far, current running stretch) lives in `localStorage` per user, so it survives reloads and closed
  tabs and stays in step across open tabs (`src/hooks/use-local-timer.ts`,
  `src/lib/work-timer/local-timer.ts`).
- Stop sends the finished session once (`recordWorkSession`): start and stop moments plus
  `workedSeconds`, which excludes pauses. If the save fails, the timer is restored so no time is lost.
- Durations shown and logged to Time Tracking use `workedSeconds`; sessions from before this change
  (null `workedSeconds`) use their start-to-stop range. Editing a session's times clears
  `workedSeconds`, so the edited range becomes the truth.
- A session still running on the server from the old version is adopted into the browser on first
  load and finished by the next Stop.

## Consequences

- No server wait or clock comparison on Start, so the timer is instant and always ticks.
- A running timer is tied to the browser it was started in; another device does not see it until it
  is stopped.
- Clearing site data while a timer runs loses that unsaved session.
