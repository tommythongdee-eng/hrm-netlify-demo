// Calendar-day helpers shared by attendance and leave. Dates are normalized
// to UTC midnight so "the same day" comparisons don't depend on server or
// client timezone.

export function parseDateOnly(value: string): Date {
  const isoDatePart = value.slice(0, 10);
  return new Date(`${isoDatePart}T00:00:00.000Z`);
}

export function startOfDayUtc(date: Date = new Date()): Date {
  return parseDateOnly(date.toISOString());
}

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function eachDateInRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}
