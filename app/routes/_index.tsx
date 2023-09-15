import * as React from "react";

import { json, type V2_MetaFunction, type LoaderArgs } from "@remix-run/node";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { DateTime } from "luxon";
import clsx from "clsx";
import { mapDateTime } from "~/utils/date-time";

type Month = {
  year: number;
  name: string;
  days: string[];
  isOverflowMonth: boolean;
};

export const meta: V2_MetaFunction = () => {
  return [{ title: "Colourdar" }];
};

export async function loader({ request }: LoaderArgs) {
  const searchParams = new URL(request.url).searchParams;

  const mode = searchParams.get("mode") ?? "compact";
  const isoTargetDate = searchParams.get("targetDate");
  const zone = "Europe/Paris";
  const locale = "fr";
  const today = DateTime.local({ locale, zone });
  let targetDate = isoTargetDate
    ? DateTime.fromISO(isoTargetDate, { zone, locale })
    : today;

  if (targetDate < today) {
    targetDate = today;
  }

  let months: Month[] = [];

  if (targetDate) {
    if (mode === "compact") {
      const firstMonthDays = mapDateTime(
        today.startOf("month").startOf("week"),
        today.endOf("month").endOf("week"),
        { days: 1 },
        (date) => {
          return date.toISODate()!;
        }
      );
      const firstMonth: Month = {
        name: today.monthLong!,
        year: today.year,
        days: firstMonthDays,
        isOverflowMonth: false,
      };

      const lastMonthDays = mapDateTime(
        targetDate.startOf("month").startOf("week"),
        targetDate.endOf("month").endOf("week"),
        { days: 1 },
        (date) => {
          return date.toISODate()!;
        }
      );
      const lastMonth: Month = {
        name: targetDate.monthLong!,
        year: targetDate.year,
        days: lastMonthDays,
        isOverflowMonth: false,
      };

      if (
        firstMonth.name === lastMonth.name &&
        firstMonth.year === lastMonth.year
      ) {
        months = [firstMonth];
      } else {
        months = [firstMonth, lastMonth];
      }
    } else {
      let currentDate = today.startOf("month").setLocale("fr");

      for (let i = 0; currentDate < targetDate.endOf("week"); i++) {
        let month = months.find(
          (m) => m.year === currentDate.year && m.name === currentDate.monthLong
        );

        if (month == null) {
          month = {
            year: currentDate.year,
            name: currentDate.monthLong!,
            days: [],
            isOverflowMonth: currentDate > targetDate,
          };
          months.push(month);

          let startOfWeek = currentDate.startOf("week");

          while (startOfWeek < currentDate) {
            month.days.push(startOfWeek.toISODate()!);
            startOfWeek = startOfWeek.plus({ day: 1 });
          }
        }

        month.days.push(currentDate.toISODate()!);

        if (currentDate.daysInMonth === currentDate.day) {
          const endOfWeek = currentDate.endOf("week");
          let currentOffsetDate = currentDate.plus({ day: 1 });

          while (currentOffsetDate < endOfWeek) {
            month.days.push(currentOffsetDate.toISODate()!);
            currentOffsetDate = currentOffsetDate.plus({ day: 1 });
          }
        }

        currentDate = currentDate.plus({ day: 1 });
      }

      const lastMonth = months[months.length - 1];

      if (lastMonth) {
        const lastDay = lastMonth.days[lastMonth.days.length - 1];
        let currentDate = DateTime.fromISO(lastDay).plus({ day: 1 });
        const lastMonthDate = currentDate.endOf("month").endOf("week");

        while (currentDate < lastMonthDate) {
          lastMonth.days.push(currentDate.toISODate()!);
          currentDate = currentDate.plus({ day: 1 });
        }
      }
    }
  }

  months = months.filter((month) => !month.isOverflowMonth);

  return json({
    months,
    isoToday: today.toISODate()!,
    isoTargetDate,
    mode,
  });
}

export default function Index() {
  const { months, isoToday, isoTargetDate, mode } =
    useLoaderData<typeof loader>();
  const submit = useSubmit();
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleChangeInput = () => {
    submit(formRef.current);
  };

  return (
    <main className="min-h-screen pt-8">
      <Form ref={formRef}>
        <div className="flex flex-row justify-center">
          <div className="max-w-3xl space-y-4">
            <div className="space-x-2">
              <input
                type="date"
                name="targetDate"
                defaultValue={isoTargetDate ?? isoToday}
                onChange={handleChangeInput}
                className="text-3xl"
              />
            </div>

            <div className="">
              <label htmlFor="mode" className="font-light text-xs">
                Mode d'affichage
              </label>
              <select
                name="mode"
                onChange={handleChangeInput}
                className="p-2 block w-full rounded-lg text-sm"
              >
                <option value="compact" selected={mode === "compact"}>
                  Compact
                </option>
                <option value="full" selected={mode === "full"}>
                  Complet
                </option>
              </select>
            </div>
          </div>
        </div>
      </Form>
      <div className="bg-white">
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-x-8 gap-y-16 px-4 py-16 sm:grid-cols-2 sm:px-6 xl:max-w-none xl:grid-cols-3 xl:px-8 2xl:grid-cols-4">
          {months.map((month) => (
            <section key={month.name} className="text-center">
              <div className="space-x-1">
                <h2 className="inline text-sm font-semibold text-gray-900">
                  {month.name}
                </h2>
                <h4 className="inline text-xs font-light">{month.year}</h4>
              </div>
              <div className="mt-6 grid grid-cols-7 text-xs leading-6 text-gray-500">
                <div>L</div>
                <div>M</div>
                <div>M</div>
                <div>J</div>
                <div>V</div>
                <div>S</div>
                <div>D</div>
              </div>
              <div className="isolate mt-2 grid grid-cols-7 gap-px rounded-lg overflow-hidden bg-gray-200 text-sm shadow ring-1 ring-gray-200">
                {month.days.map((day, dayIdx) => {
                  const today = DateTime.fromISO(isoToday);
                  const date = DateTime.fromISO(day, { locale: "fr" });
                  const isToday = day === isoToday;
                  const isTargetDay = day === isoTargetDate;
                  const isNotableday = isToday || isTargetDay;
                  const isCurrentMonth = date.monthLong === month.name;
                  const weeksSinceToday = Math.floor(
                    date.diff(today.startOf("week"), "weeks").weeks
                  );

                  return (
                    <div
                      key={day}
                      className={clsx(
                        "text-gray-900",
                        !isCurrentMonth && "bg-opacity-0",
                        isCurrentMonth && weeksSinceToday % 2 === 0
                          ? "bg-emerald-50"
                          : "bg-indigo-50",
                        date.day === 1 && "rounded-tl-lg",
                        dayIdx === 6 && "rounded-tr-lg",
                        dayIdx === month.days.length - 7 && "rounded-bl-lg",
                        date.daysInMonth === date.day && "rounded-br-lg",
                        "py-1.5"
                      )}
                    >
                      <time
                        dateTime={day}
                        className={clsx(
                          isCurrentMonth &&
                            isNotableday &&
                            "font-semibold text-white",
                          isToday && "bg-indigo-600",
                          isCurrentMonth && isTargetDay && "bg-emerald-600",
                          "mx-auto flex h-7 w-7 items-center justify-center rounded-full"
                        )}
                      >
                        {date.day}
                      </time>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
