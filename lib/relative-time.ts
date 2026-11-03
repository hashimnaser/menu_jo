export function formatRelativeTime(date: string, locale: "ar" | "en" = "ar") {
  const formatter = new Intl.RelativeTimeFormat(locale === "ar" ? "ar-JO" : "en", { numeric: "auto" });
  const timestamp = Date.parse(date);
  if (!Number.isFinite(timestamp)) return locale === "ar" ? "تاريخ غير معروف" : "Unknown date";

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 60) return "الآن";

  const intervals: {
    unit: Intl.RelativeTimeFormatUnit;
    secondsPerUnit: number;
    nextThreshold: number;
  }[] = [
    { unit: "minute", secondsPerUnit: 60, nextThreshold: 60 * 60 },
    { unit: "hour", secondsPerUnit: 60 * 60, nextThreshold: 24 * 60 * 60 },
    { unit: "day", secondsPerUnit: 24 * 60 * 60, nextThreshold: 30 * 24 * 60 * 60 },
    { unit: "month", secondsPerUnit: 30 * 24 * 60 * 60, nextThreshold: 365 * 24 * 60 * 60 },
    { unit: "year", secondsPerUnit: 365 * 24 * 60 * 60, nextThreshold: Infinity },
  ];
  const { unit, secondsPerUnit } =
    intervals.find((interval) => elapsedSeconds < interval.nextThreshold) ??
    intervals[intervals.length - 1];
  const amount = Math.floor(elapsedSeconds / secondsPerUnit);

  return formatter.format(-amount, unit);
}
