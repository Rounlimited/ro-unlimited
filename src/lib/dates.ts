/**
 * "Today" for a construction company is the day in EASTERN time — where the
 * crews are — never UTC. A server on UTC flips to tomorrow at 8pm Easley
 * time, which would mark this afternoon's pour "slipped" at supper.
 */
export function todayET(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}
