import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader2, Inbox } from 'lucide-react';
import { NotificationsService } from '../../services/notifications.service';
import { AppNotification, formatNotificationTime, NOTIFICATION_ICONS } from '../../types/notifications.types';

const POLL_MS = 20_000;

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await NotificationsService.fetchAll();
      setItems(result.items);
      setUnreadCount(result.unreadCount);
    } catch {
      if (!silent) {
        setItems([]);
        setUnreadCount(0);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => load(true), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (open) void load(true);
  }, [open, load]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleClick = async (n: AppNotification) => {
    if (!n.isRead) {
      try {
        await NotificationsService.markRead(n.id);
        setItems(prev => prev.map(i => (i.id === n.id ? { ...i, isRead: true } : i)));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch {
        // ignore
      }
    }
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  };

  const handleMarkAll = async () => {
    try {
      await NotificationsService.markAllRead();
      setItems(prev => prev.map(i => ({ ...i, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        title="Notifications"
        className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition relative focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-indigo-500 text-[9px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-200">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tout lire
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-slate-500 gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement…
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-2">
                <Inbox className="w-8 h-8 opacity-40" />
                <p className="text-xs">Aucune notification</p>
              </div>
            ) : (
              items.map(n => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-800/60 hover:bg-slate-800/40 transition ${
                    !n.isRead ? 'bg-indigo-500/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <span className="text-base shrink-0 mt-0.5">{NOTIFICATION_ICONS[n.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold truncate ${!n.isRead ? 'text-slate-100' : 'text-slate-300'}`}>
                          {n.title}
                        </p>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{formatNotificationTime(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
