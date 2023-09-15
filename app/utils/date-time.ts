import type { DateTime, DurationLike } from "luxon";

export function mapDateTime<TResult>(
  startDate: DateTime,
  endDate: DateTime,
  interval: DurationLike,
  iteratee: (
    date: DateTime,
    index: number,
    startDate: DateTime,
    endDate: DateTime
  ) => TResult
): TResult[] {
  let i = 0;
  let currentDate = startDate;
  let results: TResult[] = [];

  while (currentDate < endDate) {
    const result = iteratee(currentDate, i, startDate, endDate);

    results.push(result);

    i++;
    currentDate = currentDate.plus(interval);
  }

  return results;
}
