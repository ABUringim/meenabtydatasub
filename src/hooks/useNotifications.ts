import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserNotification } from '../types';
import { storage } from '../services/storage';

export function useNotifications(targetUserId?: string) {
  const { user } = useAuth();
  const uid = targetUserId || user?.uid;

  const [notifications, setNotifications] = useState<UserNotification[]>(() => {
    return uid ? storage.getUserNotifications(uid) : [];
  });
  const [loading, setLoading] = useState<boolean>(!uid);

  useEffect(() => {
    if (!uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Storage subscription (immediate local & cross-tab sync)
    const unsubStorage = storage.subscribeUserNotifications(uid, (items) => {
      setNotifications(items);
      setLoading(false);
    });

    return () => {
      unsubStorage();
    };
  }, [uid]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(
    (id: string) => {
      if (!uid) return;
      storage.markNotificationAsRead(uid, id);
    },
    [uid]
  );

  const markAllAsRead = useCallback(
    () => {
      if (!uid) return;
      storage.markAllNotificationsAsRead(uid);
    },
    [uid]
  );

  const clearAll = useCallback(
    () => {
      if (!uid) return;
      storage.clearAllNotifications(uid);
    },
    [uid]
  );

  const addNotification = useCallback(
    (notif: Omit<UserNotification, 'id' | 'createdAt'>) => {
      return storage.addNotificationForUser(notif);
    },
    []
  );

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll,
    addNotification,
  };
}
