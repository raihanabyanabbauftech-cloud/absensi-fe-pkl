import type { AttendanceRecord } from "@/lib/services/attendance";

const TARGET_WEEKLY_HOURS = 40;
const DAILY_TARGET_MINUTES = 8 * 60;
const WORK_DAY_END_HOUR = 17;

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function minutesForRecord(record: AttendanceRecord, day: Date): number {
  if (!record.clock_in_time) return 0;
  const startDate = new Date(record.clock_in_time);
  if (!isSameDay(startDate, day)) return 0;

  const start = startDate.getTime();
  let end: number;
  if (record.clock_out_time) {
    end = new Date(record.clock_out_time).getTime();
  } else {
    const now = Date.now();
    const dayEnd = new Date(day);
    dayEnd.setHours(WORK_DAY_END_HOUR, 0, 0, 0);
    end = Math.min(now, dayEnd.getTime());
  }

  const diffMs = end - start;
  if (diffMs < 0) return 0;
  return Math.min(diffMs / 60000, DAILY_TARGET_MINUTES);
}

export interface WeeklyStats {
  days: Date[];
  dailyMinutes: number[];
  dailyPercentages: number[];
  totalMinutes: number;
  progress: number;
  targetHours: number;
}

export function computeWeeklyStats(records: AttendanceRecord[]): WeeklyStats {
  const now = new Date();
  const monday = getMonday(now);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }

  const targetMinutes = TARGET_WEEKLY_HOURS * 60;
  const dailyMinutes = days.map((day) =>
    records.reduce((sum, record) => sum + minutesForRecord(record, day), 0),
  );
  const totalMinutes = dailyMinutes.reduce((sum, m) => sum + m, 0);
  const progress = Math.min(Math.round((totalMinutes / targetMinutes) * 100), 100);
  const dailyPercentages = dailyMinutes.map((m) =>
    Math.min(Math.round((m / DAILY_TARGET_MINUTES) * 100), 100),
  );

  return {
    days,
    dailyMinutes,
    dailyPercentages,
    totalMinutes,
    progress,
    targetHours: TARGET_WEEKLY_HOURS,
  };
}

export function isLateRecord(record: AttendanceRecord, startHour: number): boolean {
  if (record.late_minutes != null) return record.late_minutes > 0;
  if (record.status === "telat") return true;
  if (!record.clock_in_time) return false;
  const d = new Date(record.clock_in_time);
  return d.getHours() > startHour || (d.getHours() === startHour && d.getMinutes() > 0);
}

export function countLateThisMonth(
  records: AttendanceRecord[],
  startHour = 9,
): number {
  const now = new Date();
  return records.filter((record) => {
    if (!record.clock_in_time) return false;
    const d = new Date(record.clock_in_time);
    if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) {
      return false;
    }
    return isLateRecord(record, startHour);
  }).length;
}
