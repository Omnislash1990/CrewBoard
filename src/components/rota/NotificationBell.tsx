"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import { tryGetFirebase } from "@/lib/firebase/client";
import { formatDateTime } from "@/lib/format";
import { markNotificationRead, notificationFromDoc } from "@/lib/notifications/store";
import type { CrewNotification } from "@/types";

export function NotificationBell() {
  const { profile } = useAuth();
  const [items, setItems] = useState<CrewNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const firebase = tryGetFirebase();
    if (!firebase || !profile) return;
    const alertsQuery = query(
      collection(firebase.db, "notifications"),
      where("userId", "==", profile.uid),
    );
    const unsubscribe = onSnapshot(
      alertsQuery,
      (snap) => {
        setItems(
          snap.docs
            .map(notificationFromDoc)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        );
        setError(null);
      },
      (listenError) => {
        console.error(listenError);
        setError("Alerts could not be loaded.");
      },
    );
    return unsubscribe;
  }, [profile]);

  const unread = useMemo(
    () => items.filter((item) => !item.read).length,
    [items],
  );

  async function markRead(id: string) {
    const firebase = tryGetFirebase();
    const item = items.find((entry) => entry.id === id);
    if (!firebase || !item || item.read) return;
    try {
      await markNotificationRead(firebase.db, id);
    } catch (markError) {
      console.error(markError);
      setError("Could not mark that alert as read.");
    }
  }

  async function markAllRead() {
    const firebase = tryGetFirebase();
    if (!firebase) return;
    const pending = items.filter((item) => !item.read);
    try {
      await Promise.all(
        pending.map((item) => markNotificationRead(firebase.db, item.id)),
      );
    } catch (markError) {
      console.error(markError);
      setError("Could not mark alerts as read.");
    }
  }

  const label =
    unread === 0 ? "Notifications" : `${unread} unread notifications`;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-expanded={open}
          aria-label={label}
          onClick={() => setOpen((current) => !current)}
          className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-stone-700 shadow-sm"
        >
          Alerts
          {unread > 0 ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-orange-700 px-1.5 text-xs text-white">
              {unread}
            </span>
          ) : null}
        </button>
        {open && unread > 0 ? (
          <button
            type="button"
            onClick={markAllRead}
            className="text-xs font-semibold text-orange-700"
          >
            Mark all read
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="mt-2 space-y-2">
          {error ? <p className="text-xs text-red-700">{error}</p> : null}
          {items.length === 0 ? (
            <p className="rounded-2xl bg-white px-4 py-3 text-sm text-stone-500 shadow-sm">
              No alerts yet.
            </p>
          ) : (
            items.slice(0, 30).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => markRead(item.id)}
                className={`block w-full rounded-2xl px-4 py-3 text-left shadow-sm ${
                  item.read ? "bg-white" : "bg-orange-50"
                }`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold text-stone-900">
                    {item.title}
                  </span>
                  <span className="shrink-0 text-[11px] text-stone-500">
                    {formatDateTime(item.createdAt)}
                  </span>
                </span>
                <span className="mt-1 block text-sm text-stone-600">{item.body}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
