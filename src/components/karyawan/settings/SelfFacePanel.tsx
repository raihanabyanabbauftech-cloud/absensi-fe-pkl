"use client";

import { useRef, useState } from "react";
import { FiCheck, FiClock, FiCamera, FiUpload } from "react-icons/fi";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";
import SelfieVerification from "@/components/karyawan/attendance/SelfieVerification";
import { registerSelfFace } from "@/lib/services/face";

export default function SelfFacePanel() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const employeeId = session?.user?.id ?? "";

  const [capturing, setCapturing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const reset = () => {
    setPreview(null);
    setCapturing(false);
    setError(null);
  };

  const submit = async () => {
    if (!preview || !employeeId) {
      setError(t("adminFace.required"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await registerSelfFace(employeeId, preview);
      setPending(true);
      reset();
    } catch (err) {
      if (err instanceof Error && "code" in err && err.code === "FACE_PENDING_REVIEW") {
        setPending(true);
        reset();
      } else {
        setError(err instanceof Error ? err.message : t("adminFace.failed"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">
        {t("selfFace.title")}
      </h3>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
        {t("selfFace.desc")}
      </p>

      {pending && (
        <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 text-xs text-amber-700 dark:text-amber-400 rounded-lg flex items-center gap-2">
          <FiClock size={14} className="shrink-0" />
          {t("selfFace.pendingNotif")}
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-500/10 text-xs text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {!pending ? (
        <div className="space-y-4">
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
                onClick={reset}
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
                <FiCamera size={15} />
                {t("adminFace.capture")}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-100 text-xs font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FiUpload size={15} />
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

          {preview && (
            <button
              onClick={submit}
              disabled={saving}
              className="w-full bg-[#1E3A5F] text-white text-sm font-semibold py-3 rounded-lg hover:bg-[#16304f] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <FiCheck size={16} />
              {saving ? t("common.saving") : t("selfFace.submit")}
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <FiCheck size={15} className="text-green-600 dark:text-green-400 shrink-0" />
          {t("selfFace.doneNotif")}
        </div>
      )}
    </div>
  );
}