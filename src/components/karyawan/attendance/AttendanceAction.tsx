"use client";

import { useCallback, useEffect, useState } from "react";
import { FiClock, FiCalendar } from "react-icons/fi";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";
import { apiFetch } from "@/lib/api";
import { getEmployeeDashboard, type CurrentSchedule } from "@/lib/services/dashboard";
import CheckInButton from "./CheckInButton";
import CheckOutButton from "./CheckOutButton";
import VerificationStepper from "./VerificationStepper";

const CLOCK_IN_START_HOUR = 9;
const CLOCK_IN_END_HOUR = 17;

interface AttendanceRecord {
  id: string;
  clock_in_time: string;
  clock_out_time: string | null;
}

function hourOf(value?: string | null): number {
  const p = String(value ?? "").split(":");
  const n = parseInt(p[0], 10);
  return Number.isFinite(n) ? n : NaN;
}

function isToday(isoString: string) {
  const d = new Date(isoString);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function toScheduleTime(value?: string | null): string {
  if (!value) return "";
  const p = String(value).split(":");
  return p.length >= 2 ? `${p[0]}:${p[1]}` : value;
}

export default function AttendanceAction({
  hasCheckedIn: hasCheckedInProp = false,
  hasCheckedOut: hasCheckedOutProp = false,
}) {
  const [mode, setMode] = useState(null);
  const [warning, setWarning] = useState(null);
  const [showCheckOutDone, setShowCheckOutDone] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [schedule, setSchedule] = useState<CurrentSchedule | null>(null);
  const [now, setNow] = useState(() => new Date());
  const { t } = useLanguage();

  const fetchStatus = useCallback(async () => {
    try {
      const records = await apiFetch<AttendanceRecord[]>("/attendance/me");
      setTodayRecord(records.find((r) => isToday(r.clock_in_time)) ?? null);
    } catch {
      setTodayRecord(null);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    getEmployeeDashboard()
      .then((data) => {
        setSchedule(data.current_schedule ?? null);
        try {
          if (data.current_schedule?.start_time) {
            localStorage.setItem(
              "att_schedule_start",
              data.current_schedule.start_time.slice(0, 5),
            );
          }
        } catch {
          // ignore storage errors
        }
      })
      .catch(() => setSchedule(null));
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  const hasCheckedIn = hasCheckedInProp || !!todayRecord;
  const hasCheckedOut = hasCheckedOutProp || !!todayRecord?.clock_out_time;

  const scheduleStart =
    toScheduleTime(schedule?.start_time) ||
    `${String(CLOCK_IN_START_HOUR).padStart(2, "0")}:00`;
  const scheduleEnd =
    toScheduleTime(schedule?.end_time) ||
    `${String(CLOCK_IN_END_HOUR).padStart(2, "0")}:00`;

  const startHour = Number.isFinite(hourOf(schedule?.start_time))
    ? hourOf(schedule?.start_time)
    : CLOCK_IN_START_HOUR;
  const endHour = Number.isFinite(hourOf(schedule?.end_time))
    ? hourOf(schedule?.end_time)
    : CLOCK_IN_END_HOUR;

  const clockOpen = now.getHours() >= startHour && now.getHours() < endHour;
  const checkOutOpen = now.getHours() >= startHour;

  const handleClick = (type: "in" | "out") => {
    if (type === "out") {
      if (hasCheckedOut) {
        setShowCheckOutDone(true);
        return;
      }
      if (!checkOutOpen) {
        setWarning("out");
        return;
      }
      setMode("out");
      return;
    }
    if (!clockOpen) {
      setWarning("in");
      return;
    }
    setMode("in");
  };

  const handleClose = () => {
    setMode(null);
    fetchStatus();
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">{t("attendanceAction.title")}</h3>
        <p className="text-xs text-gray-400 dark:text-gray-400 mb-4">{t("attendanceAction.desc")}</p>
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-semibold px-3 py-1.5">
            <FiCalendar size={13} />
            {t("attendanceAction.schedule")}: {scheduleStart} - {scheduleEnd}
          </span>
        </div>
        <div className="flex items-center justify-center gap-6 sm:gap-14">
          <CheckInButton disabled={hasCheckedIn} clockOpen={clockOpen} onClick={() => handleClick("in")} />
          <CheckOutButton checkedOut={hasCheckedOut} clockOpen={checkOutOpen} onClick={() => handleClick("out")} />
        </div>
      </div>

      {mode && <VerificationStepper mode={mode} onClose={handleClose} />}

      {warning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center max-w-sm mx-4 animate-bounce-in">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5">
              <FiClock size={30} className="text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              {warning === "out" ? t("attendanceAction.outsideOutTitle") : t("attendanceAction.outsideTitle")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              {warning === "out" ? t("attendanceAction.outsideOutDesc") : t("attendanceAction.outsideDesc")}
            </p>
            <button
              onClick={() => setWarning(null)}
              className="w-full bg-linear-to-r from-[#1E3A5F] to-[#4F46E5] text-white font-semibold text-sm py-3.5 rounded-xl hover:brightness-110 transition-all shadow-md"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      )}

      {showCheckOutDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center max-w-sm mx-4 animate-bounce-in">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{t("attendanceAction.doneTitle")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">{t("attendanceAction.doneDesc")}</p>
            <button
              onClick={() => setShowCheckOutDone(false)}
              className="w-full bg-linear-to-r from-[#1E3A5F] to-[#4F46E5] text-white font-semibold text-sm py-3.5 rounded-xl hover:brightness-110 transition-all shadow-md"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}