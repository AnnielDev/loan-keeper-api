const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DEFAULT_TIME_ZONE = 'UTC';

// Returns the instant corresponding to 00:00:00 of `date`'s calendar day as
// observed in `timeZone`, so day-boundary comparisons (due today, overdue)
// reflect the user's region instead of the server's local time.
export function startOfDayInTimeZone(
  date: Date,
  timeZone: string = DEFAULT_TIME_ZONE,
): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  // Interpreting the timezone's wall-clock numbers as UTC and diffing
  // against the real instant yields that timezone's offset from UTC.
  const wallClockAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  const offsetMs = wallClockAsUtc - date.getTime();

  const midnightWallClockAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
  );

  return new Date(midnightWallClockAsUtc - offsetMs);
}

export function diffInDaysInTimeZone(
  date: Date,
  reference: Date,
  timeZone: string = DEFAULT_TIME_ZONE,
): number {
  return Math.round(
    (startOfDayInTimeZone(date, timeZone).getTime() -
      startOfDayInTimeZone(reference, timeZone).getTime()) /
      MS_PER_DAY,
  );
}
