/**
 * Returns true if the given date string or Date object falls within
 * the same calendar month and year as the reference date (defaults to today).
 */
export function isInCurrentMonth(
  date: string | Date,
  reference: Date = new Date(),
): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth()
  );
}
