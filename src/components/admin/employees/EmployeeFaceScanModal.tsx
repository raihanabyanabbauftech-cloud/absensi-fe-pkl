"use client";

import { useRef, useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";
import { useLanguage } from "@/context/LanguageContext";
import SelfieVerification from "@/components/karyawan/attendance/SelfieVerification";
import { registerFaceReference } from "@/lib/services/admin";

interface Props {
  employeeId: string;
  employeeName: string;
  onClose: () => void;
  onComplete: () => void;
}

export default function EmployeeFaceScanModal({
  employeeId,
  employeeName,
  onClose,
  onComplete,
}: Props) {
  const { t } = useLanguage();

  const [capturing, setCapturing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [registered, setRegistered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (dataUrl: string) => {
    setPreview(dataUrl);
    setCapturing(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result as string);
      setCapturing(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const submit = async () => {
    if (!preview) {
      setError(t("adminFace.required"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await registerFaceReference({ employeeId, image: preview });
      setPreview(null);
      setCapturing(false);
      setRegistered(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("adminFace.failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between px-8 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
              {t("adminFace.title")}
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {employeeName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
            aria-label={t("common.close")}
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="p-8 space-y-5">
          {registered ? (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center mb-4">
                <FiCheck size={28} />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-1">
                {t("adminFace.registeredTitle")}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
                {t("adminFace.registeredDesc")}
              </p>
              <button
                onClick={onComplete}
                className="mt-6 w-full bg-[#1E3A5F] text-white text-sm font-semibold py-3 rounded-lg hover:bg-[#16304f] transition-colors"
              >
                {t("common.done")}
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("adminFace.desc")}
              </p>

              {error && (
                <div className="px-4 py-3 bg-red-50 dark:bg-red-500/10 text-xs text-red-600 dark:text-red-400 rounded-lg">
                  {error}
                </div>
              )}
              {preview === null && !capturing && (
                <div className="px-4 py-3 bg-green-50 dark:bg-green-500/10 text-xs text-green-600 dark:text-green-400 rounded-lg">
                  {t("adminFace.registerSuccessHint")}
                </div>
              )}

              {capturing ? (
                <SelfieVerification onNext={handleCapture} />
              ) : preview ? (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={preview}
                    alt="Face preview"
                    className="w-40 h-40 object-cover rounded-2xl border border-gray-200 dark:border-gray-600"
                  />
                  <button
                    onClick={() => {
                      setPreview(null);
                      setCapturing(false);
                    }}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {t("adminFace.retake")}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setCapturing(true)}
                    className="flex items-center gap-2 bg-[#1E3A5F] text-white text-xs font-semibold px-5 py-2.5 rounded-lg hover:bg-[#16304f] transition-colors"
                  >
                    {t("adminFace.capture")}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-100 text-xs font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t("adminFace.uploadGallery")}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                    className="hidden"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => {
                    setPreview(null);
                    setCapturing(false);
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t("adminFace.skip")}
                </button>
                <button
                  onClick={submit}
                  disabled={saving || !preview}
                  className="flex items-center gap-2 bg-[#1E3A5F] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#16304f] transition-colors disabled:opacity-60"
                >
                  <FiCheck size={16} />
                  {saving ? t("common.saving") : t("adminFace.submit")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}