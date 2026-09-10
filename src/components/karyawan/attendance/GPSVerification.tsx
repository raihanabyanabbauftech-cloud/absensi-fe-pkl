"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  getMyLocations,
  type AssignedOfficeLocation,
} from "@/lib/services/attendance";

interface GPSVerificationProps {
  onNext: (coords: { lat: number; lng: number }) => void;
}

type GpsStatus = "loading" | "success" | "outside" | "noLocations" | "error";

function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function GPSVerification({ onNext }: GPSVerificationProps) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<GpsStatus>("loading");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearest, setNearest] = useState<{
    location: AssignedOfficeLocation;
    distance: number;
  } | null>(null);
  const locationsRef = useRef<AssignedOfficeLocation[]>([]);

  const resolveToNearest = (
    lat: number,
    lng: number,
    locs: AssignedOfficeLocation[],
  ) => {
    let best: {
      location: AssignedOfficeLocation;
      distance: number;
    } | null = null;
    for (const loc of locs) {
      const d = getDistanceMeters(lat, lng, loc.latitude, loc.longitude);
      if (!best || d < best.distance) {
        best = { location: loc, distance: d };
      }
    }
    setCoords({ lat, lng });
    if (best && best.distance <= best.location.radius_meters) {
      setNearest(best);
      setStatus("success");
    } else {
      setNearest(best);
      setStatus("outside");
    }
  };

  const resolveCurrentPosition = (locs: AssignedOfficeLocation[]) => {
    if (!locs.length) {
      setStatus("noLocations");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolveToNearest(
          position.coords.latitude,
          position.coords.longitude,
          locs,
        ),
      () => setStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const verify = () => {
    setStatus("loading");
    setNearest(null);
    resolveCurrentPosition(locationsRef.current);
  };

  useEffect(() => {
    let mounted = true;
    getMyLocations()
      .then((locs) => {
        if (!mounted) return;
        locationsRef.current = locs;
        if (!locs.length) {
          setStatus("noLocations");
          return;
        }
        setStatus("loading");
        navigator.geolocation.getCurrentPosition(
          (position) =>
            resolveToNearest(
              position.coords.latitude,
              position.coords.longitude,
              locs,
            ),
          () => setStatus("error"),
          { enableHighAccuracy: true, timeout: 10000 },
        );
      })
      .catch(() => {
        if (!mounted) return;
        setStatus("noLocations");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const nearestLabel = nearest?.location.name ?? "";
  const nearestDistance = nearest ? Math.round(nearest.distance) : 0;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-56 h-56 rounded-full overflow-hidden bg-gray-900 mb-6 border-4 border-white shadow-lg flex items-center justify-center">
        {status === "loading" && (
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {status === "outside" && (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-amber-400">
            <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
            <path d="M9 15l6 6M15 15l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
        {status === "noLocations" && (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs px-6 text-center">
            {t("gpsVerification.noLocations")}
          </div>
        )}
        {status === "error" && (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs px-6 text-center">
            {t("gpsVerification.locationError")}
          </div>
        )}
        {status === "success" && (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-green-400">
            <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}
      </div>

      {status === "loading" && (
        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-2">{t("gpsVerification.title")}</h3>
      )}

      {status === "error" && (
        <>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-2">{t("gpsVerification.title")}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 max-w-xs">{t("gpsVerification.errorDesc")}</p>
          <button
            onClick={verify}
            className="w-full bg-linear-to-r from-[#1E3A5F] to-[#4F46E5] text-white font-semibold text-sm py-3.5 rounded-xl hover:brightness-110 transition-all shadow-md shadow-blue-900/20"
          >
            {t("gpsVerification.retry")}
          </button>
        </>
      )}

      {status === "success" && (
        <>
          <h3 className="font-bold text-green-600 dark:text-green-400 text-lg mb-2">{t("gpsVerification.success")}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-1 max-w-xs">
            {nearestLabel ? t("gpsVerification.atLocation", { location: nearestLabel }) : t("gpsVerification.successDesc")}
          </p>
          {nearest && (
            <p className="text-xs text-gray-400 mb-4">
              {t("gpsVerification.distanceLabel")}: {nearestDistance} m
            </p>
          )}
          <button
            onClick={() => coords && onNext(coords)}
            className="w-full bg-linear-to-r from-[#1E3A5F] to-[#4F46E5] text-white font-semibold text-sm py-3.5 rounded-xl hover:brightness-110 transition-all shadow-md shadow-blue-900/20"
          >
            {t("gpsVerification.continue")}
          </button>
        </>
      )}

      {status === "outside" && (
        <>
          <h3 className="font-bold text-amber-600 dark:text-amber-400 text-lg mb-2">{t("gpsVerification.outsideTitle")}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-1 max-w-xs">{t("gpsVerification.outsideDesc")}</p>
          {nearest && (
            <p className="text-xs text-gray-400 mb-4">
              {t("gpsVerification.distanceLabel")}: {nearestDistance} m{" "}
              <span className="text-amber-500">(max {nearest.location.radius_meters} m)</span>
            </p>
          )}
          <button
            onClick={verify}
            className="w-full bg-linear-to-r from-[#1E3A5F] to-[#4F46E5] text-white font-semibold text-sm py-3.5 rounded-xl hover:brightness-110 transition-all shadow-md shadow-blue-900/20"
          >
            {t("gpsVerification.retry")}
          </button>
        </>
      )}

      {status === "noLocations" && (
        <>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-2">{t("gpsVerification.noLocationsTitle")}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 max-w-xs">{t("gpsVerification.noLocations")}</p>
          <button
            onClick={verify}
            className="w-full bg-linear-to-r from-[#1E3A5F] to-[#4F46E5] text-white font-semibold text-sm py-3.5 rounded-xl hover:brightness-110 transition-all shadow-md shadow-blue-900/20"
          >
            {t("gpsVerification.retry")}
          </button>
        </>
      )}
    </div>
  );
}