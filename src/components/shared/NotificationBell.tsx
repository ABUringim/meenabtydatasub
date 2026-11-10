import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { timeAgo } from '../../lib/formatters';
import {
  Bell,
  CheckCheck,
  Trash2,
  CheckCircle2,
  Wallet,
  ShieldCheck,
  Tag,
  AlertCircle,
  ExternalLink,
  X,
} from 'lucide-react';
import { UserNotification } from '../../types';

interface NotificationBellProps {
  onNavigate?: (view: string) => void;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigate, className = '' }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const getNotificationIcon = (type: UserNotification['type']) => {
    switch (type) {
      case 'transaction':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'wallet':
        return <Wallet className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'security':
        return <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />;
      case 'promo':
        return <Tag className="w-4 h-4 text-purple-500 shrink-0" />;
      case 'system':
      default:
        return <AlertCircle className="w-4 h-4 text-sky-500 shrink-0" />;
    }
  };

  const handleNotificationClick = (notif: UserNotification) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    if (notif.link && onNavigate) {
      onNavigate(notif.link);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
        title="Notifications"
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-75">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="text-[11px] font-medium text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                aria-label="Close notifications"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List of Notifications */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No notifications yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  We will notify you here when transactions complete or your wallet is funded.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    n.read ? 'bg-white hover:bg-slate-50/80' : 'bg-emerald-50/40 hover:bg-emerald-50/70'
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs truncate ${n.read ? 'font-medium text-slate-800' : 'font-bold text-slate-900'}`}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Unread" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                      <span>{timeAgo(n.createdAt)}</span>
                      {n.link && (
                        <span className="text-emerald-700 font-semibold flex items-center gap-0.5 hover:underline">
                          View details <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => clearAll()}
                className="text-[11px] text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors px-2 py-1 rounded"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear history</span>
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('customer-dashboard');
                    setIsOpen(false);
                  }}
                  className="text-[11px] font-semibold text-emerald-700 hover:underline px-2 py-1"
                >
                  Go to Dashboard
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
