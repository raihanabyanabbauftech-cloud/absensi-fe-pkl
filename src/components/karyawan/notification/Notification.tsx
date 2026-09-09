"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  FiBell,
  FiCheck,
  FiClock,
  FiCheckSquare,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

const ICONS: Record<string, any> = {
  reminder: FiClock,
  late: FiAlertCircle,
  todo: FiCheckSquare,
  leave_approved: FiCheckCircle,
  leave_rejected: FiXCircle,
  missing_clock_in: FiAlertCircle,
  missing_clock_out: FiAlertCircle,
  late_clock_in: FiAlertCircle,
};

const ICON_STYLES: Record<string, string> = {
  reminder: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400",
  late: "bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  todo: "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  leave_approved:
    "bg-green-50 text-green-600 dark:bg-green-500/20 dark:text-green-400",
  leave_rejected: "bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400",
  missing_clock_in: "bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  missing_clock_out: "bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  late_clock_in: "bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
};

const DEFAULT_ICON_STYLES =
  "bg-slate-100 text-slate-500 dark:bg-gray-600/50 dark:text-gray-300";

type NotificationItem = {
  id: string;
  type: "reminder" | "late" | "todo";
  count?: number;
};

type ServerNotification = {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function getDateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function buildTodayItems(): NotificationItem[] {
  if (typeof window === "undefined") return [];
  const now = new Date();
  const dateKey = getDateKey(now);
  const items: NotificationItem[] = [];

  let hasCheckedIn = false;
  let checkinTime: number | null = null;
  try {
    const raw = localStorage.getItem("lokasi_" + dateKey);
    const data = raw ? JSON.parse(raw) : null;
    hasCheckedIn = data?.mode === "in" || data?.mode === "out";
    const ck = localStorage.getItem("checkin_" + dateKey);
    checkinTime = ck ? parseInt(ck, 10) : null;
  } catch {
    // ignore storage errors
  }

  const hour = now.getHours();
  const minute = now.getMinutes();

  if (!hasCheckedIn && hour >= 9) {
    items.push({ id: "reminder", type: "reminder" });
  }

  if (checkinTime) {
    const ct = new Date(checkinTime);
    const isLate =
      ct.getHours() > 9 || (ct.getHours() === 9 && ct.getMinutes() > 0);
    if (isLate) {
      items.push({ id: "late", type: "late" });
    }
  }

  try {
    const raw = localStorage.getItem("todolist_" + dateKey);
    const list = raw ? JSON.parse(raw) : [];
    const pending = list.filter((i) => !i.done).length;
    if (pending > 0) {
      items.push({ id: "todo", type: "todo", count: pending });
    }
  } catch {
    // ignore storage errors
  }

  return items.slice(0, 3);
}

let cacheKey = "";
let cachedItems: NotificationItem[] = [];

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): NotificationItem[] {
  const items = buildTodayItems();
  const key = JSON.stringify(items);
  if (key !== cacheKey) {
    cacheKey = key;
    cachedItems = items;
  }
  return cachedItems;
}

function getServerSnapshot(): NotificationItem[] {
  return cachedItems;
}

interface Props {
  dark?: boolean;
  className?: string;
}

export default function Notification({ dark = true, className = "" }: Props) {
  const { t, locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [serverItems, setServerItems] = useState<ServerNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("notification_dismissed");
      if (raw) setReadIds(JSON.parse(raw));
    } catch {
      // ignore storage errors
    }
  }, []);

  const persistReadIds = (ids: string[]) => {
    setReadIds(ids);
    try {
      localStorage.setItem("notification_dismissed", JSON.stringify(ids));
    } catch {
      // ignore storage errors
    }
  };

  const localItems = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const items = localItems.map((item) => ({
    ...item,
    unread: !readIds.includes(item.id),
  }));

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    apiFetch<ServerNotification[]>("/notifications/me").then(setServerItems).catch(() => {
      // keep local-only notifications if the API is unavailable
    });
  }, [open]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      apiFetch<ServerNotification[]>("/notifications/me")
        .then(setServerItems)
        .catch(() => {});
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const unreadServer = serverItems.filter((i) => !i.is_read).length;
  const unreadLocal = items.filter((i) => i.unread).length;
  const unreadCount = unreadServer + unreadLocal;

  const markAllRead = () => {
    persistReadIds([...new Set([...readIds, ...items.map((i) => i.id)])]);
    setServerItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
    apiFetch(`/notifications/read-all`, { method: "PATCH" })
      .then(() => apiFetch<ServerNotification[]>("/notifications/me"))
      .then(setServerItems)
      .catch(() => {});
  };

  const markServerRead = (id: string) => {
    setServerItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_read: true } : i))
    );
    apiFetch(`/notifications/${id}/read`, { method: "PATCH" })
      .then(() => apiFetch<ServerNotification[]>("/notifications/me"))
      .then(setServerItems)
      .catch(() => {});
  };

  const dismissLocal = (id: string) => {
    persistReadIds(readIds.includes(id) ? readIds : [...readIds, id]);
  };

  const formatServerTime = (iso: string) => {
    const ts = new Date(iso);
    const now = new Date();
    const sameDay = ts.toDateString() === now.toDateString();
    if (!sameDay) {
      return ts.toLocaleDateString(locale, { day: "numeric", month: "short" });
    }
    return ts.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const serverIcon = (type: string) => ICONS[type] ?? FiBell;
  const serverIconStyle = (type: string) => ICON_STYLES[type] ?? DEFAULT_ICON_STYLES;

  const isEmpty = serverItems.length === 0 && items.length === 0;

  return (
    <div ref={ref} className={`relative shrink-0 ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("notification.title")}
        title={t("notification.title")}
        className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          dark
            ? "bg-white/15 text-white hover:bg-white/25"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        }`}
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span
            className={`absolute top-1.5 right-2 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ${
              dark ? "ring-2 ring-[#1E3A5F]" : "ring-2 ring-white"
            }`}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{t("notification.title")}</h4>
              <p className="text-xs text-gray-400">{t("notification.subtitle")}</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                <FiCheck size={14} />
                {t("notification.markAllRead")}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
            {isEmpty && (
              <div className="px-4 py-10 text-center">
                <p className="text-xs text-gray-400">{t("notification.empty")}</p>
              </div>
            )}

            {serverItems.map((item) => {
              const Icon = serverIcon(item.type);
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => !item.is_read && markServerRead(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !item.is_read) markServerRead(item.id);
                  }}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                >
                  <div className="relative shrink-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${serverIconStyle(item.type)}`}>
                      <Icon size={16} />
                    </div>
                    {!item.is_read && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {item.message}
                    </p>
                    <p className="text-[11px] text-gray-300 dark:text-gray-500 mt-1">
                      {formatServerTime(item.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}

            {items.map((item) => {
              const Icon = ICONS[item.type];
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => item.unread && dismissLocal(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && item.unread) dismissLocal(item.id);
                  }}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                >
                  <div className="relative shrink-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${ICON_STYLES[item.type]}`}>
                      <Icon size={16} />
                    </div>
                    {item.unread && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {t(`notification.items.${item.type}.title`)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t(`notification.items.${item.type}.desc`, item.count ? { count: item.count } : undefined)}
                    </p>
                    <p className="text-[11px] text-gray-300 dark:text-gray-500 mt-1">
                      {t("notification.today")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}