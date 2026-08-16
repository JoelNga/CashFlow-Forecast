# Cash-Flow Forecaster

A React + TypeScript (Vite) app that projects your day-by-day balance across daily, weekly,
monthly, annual, and one-off income/expenses, then flags your tightest day. Switch between a
line chart and an expandable calendar view, and pan the window backwards/forwards.

## Run it

```bash
npm install
npm run dev      # dev server
npm run lint     # oxlint
```

## How the forecast works

`src/engine/forecast.ts` is a pure module. It:

1. Expands every `Entry` into its actual occurrence dates inside the window
   (daily / weekly / monthly / annual / once), clamping day-of-month where needed.
2. Walks the window day by day, applying each day's transactions **at start of day**,
   and accumulates a running balance.
3. Tracks the earliest date that reaches the minimum balance.

### Reference date, daily logs, and the projected average

A single **`referenceDate`** (the real "today") separates the window's past from its future:

- **Days up to and including the reference date:** routine occurrences + the real net of
  any `DailyLog`s dated that day (0 if none logged) — so panning back shows actual activity.
- **Future days:** routine occurrences + a single **projected daily average**, computed
  once per run as the mean net of the trailing 30 logged days up to and including the day
  before the reference date. Only days that actually have a log count; missing days are
  treated as absent, not zero. **Fallback:** if there is no trailing history yet, today's
  logged net is used as the average so freshly logged spend projects forward immediately.

`listDayActivity(...)` backs the calendar's expandable day rows: the day's entry
occurrences, its logs, and on future days the projected-average line (only when non-zero).

### Planned one-offs vs. recorded reality

- The **Add form is for planned items**; `Once` ("One-off (planned)") is date-constrained
  to today or later. Past one-offs belong in the log.
- The **Daily log is for what actually happened**, date-constrained to today or earlier.

## Decisions and assumptions

- **Posting time:** transactions post at the start of the day, before that day's balance is
  recorded.
- **Monthly/annual day clamping:** an entry anchored on the 29th–31st falls back to the last
  day of shorter months (e.g. Jan 31 → Feb 28; Feb 29 in a leap year).
- **Weekly:** every 7 days from the anchor date; the anchor is the first occurrence.
- **Daily:** every calendar day from the anchor onward.
- **Once:** a single occurrence on exactly its anchor date, included only if inside the window.
- **Window:** inclusive `[startDate, startDate + windowDays - 1]`; panning shifts `startDate`
  by `windowDays`. A transaction on the final day is included.
- **Low point ties:** the earliest date winning the minimum is reported.
- **Amounts:** non-negative inputs; income applied positive, expenses negative. Display
  currency is RM.