"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { apiFetch, ApiError } from "@/lib/api";
import ProgressCircle from "./ProgressCircle";
import GPSVerification from "./GPSVerification";
import SelfieVerification from "./SelfieVerification";
import AttendanceSuccess from "./AttendanceSuccess";

interface AttendanceResult {
  id: string;
  clock_in_time: string;
  clock_out_time: string | null;
}

const ERROR_KEY_MAP: Record<string, string> = {
  OUTSIDE_RADIUS: "verificationStepper.errors.outsideRadius",
  LOCATION_NOT_ASSIGNED: "verificationStepper.errors.locationNotAssigned",
  FACE_MISMATCH: "verificationStepper.errors.faceMismatch",
  FACE_REFERENCE_NOT_FOUND: "verificationStepper.errors.noFaceReference",
  NO_SCHEDULE: "verificationStepper.errors.noSchedule",
  NO_CLOCK_IN: "verificationStepper.errors.noClockIn",
  FACE_IMAGE_REQUIRED: "verificationStepper.errors.captureRequired",
  ALREADY_CLOCKED_IN: "verificationStepper.errors.alreadyClockIn",
  TOO_EARLY: "verificationStepper.errors.tooEarly",
  WINDOW_CLOSED: "verificationStepper.errors.windowClosed",
};

export default function VerificationStepper({ mode = "in", onClose }) {
  const [step, setStep] = useState(1);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<AttendanceResult | null>(null);
  const { t } = useLanguage();

  const title = mode === "in" ? t("verificationStepper.checkIn") : t("verificationStepper.checkOut");
  const endpoint = mode === "in" ? "/attendance/clock-in" : "/attendance/clock-out";

  const handleGpsNext = (nextCoords: { lat: number; lng: number }) => {
    setCoords(nextCoords);
    setStep(2);
  };

  const handleSelfieNext = async (imageData: string) => {
    if (!coords) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const data = await apiFetch<AttendanceResult>(endpoint, {
        method: "POST",
        body: JSON.stringify({ lat: coords.lat, lng: coords.lng, face_image: imageData }),
      });
      setResult(data);
      setStep(3);
    } catch (err) {
      if (err instanceof ApiError) {
        const key = ERROR_KEY_MAP[err.code];
        setErrorMsg(key ? t(key) : err.message);
      } else {
        setErrorMsg(t("verificationStepper.errors.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{title}</h3>
              <p className="text-xs text-gray-400">{t("verificationStepper.subtitle")}</p>
            </div>
          </div>
          <span className="w-9 h-9 rounded-full bg-green-50 dark:bg-green-500/15 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V5l7-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        <div className="px-6 pt-5">
          <ProgressCircle step={step} />
        </div>

        <div className="px-6 pb-6 pt-2">
          {step === 1 && <GPSVerification onNext={handleGpsNext} />}

          {step === 2 && !submitting && <SelfieVerification onNext={handleSelfieNext} />}

          {step === 2 && submitting && (
            <div className="flex flex-col items-center text-center py-10">
              <div className="w-10 h-10 border-4 border-gray-300 border-t-[#4F46E5] rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("verificationStepper.submitting")}</p>
            </div>
          )}

          {step === 3 && result && (
            <AttendanceSuccess
              mode={mode}
              onFinish={onClose}
              serverTime={mode === "in" ? result.clock_in_time : result.clock_out_time}
            />
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center max-w-sm mx-4 animate-bounce-in">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/15 flex items-center justify-center mx-auto mb-5">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-red-500">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{t("verificationStepper.failedTitle")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">{errorMsg}</p>
            <button
              onClick={() => setErrorMsg(null)}
              className="w-full bg-linear-to-r from-[#1E3A5F] to-[#4F46E5] text-white font-semibold text-sm py-3.5 rounded-xl hover:brightness-110 transition-all shadow-md"
            >
              {t("verificationStepper.tryAgain")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}