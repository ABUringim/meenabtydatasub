import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { storage } from '../services/storage';

const DEFAULT_AVAILABILITY = {
  airtime: { enabled: true },
  data: { enabled: true },
  tv: { enabled: true },
  electricity: { enabled: true },
  exam: { enabled: true },
  remit: { enabled: true },
  invoice: { enabled: true },
  giftcard: { enabled: true },
  transport: { enabled: true },
  travel: { enabled: true },
};

/**
 * Hook to monitor real-time availability of services.
 * Subscribes to `admin_settings/services` in Firestore with fallback to local storage settings.
 */
export function useServicesAvailability() {
  const [services, setServices] = useState(() => {
    try {
      const stored = storage.getSettings()?.service_status;
      if (stored) {
        return {
          airtime: { enabled: stored.airtime !== false },
          data: { enabled: stored.data !== false },
          tv: { enabled: stored.tv !== false },
          electricity: { enabled: stored.electricity !== false },
          exam: { enabled: stored.exam !== false },
          remit: { enabled: stored.remit !== false },
          invoice: { enabled: stored.invoice !== false },
          giftcard: { enabled: stored.giftcard !== false },
          transport: { enabled: stored.transport !== false },
          travel: { enabled: stored.travel !== false },
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_AVAILABILITY;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const docRef = doc(db, 'admin_settings', 'services');
      const unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() || {};
            setServices((prev) => ({
              ...prev,
              ...data,
            }));
          }
          setLoading(false);
        },
        (_err) => {
          // If Firestore read fails (e.g. offline / unprovisioned), gracefully fall back to local storage
          const stored = storage.getSettings()?.service_status;
          if (stored) {
            setServices({
              airtime: { enabled: stored.airtime !== false },
              data: { enabled: stored.data !== false },
              tv: { enabled: stored.tv !== false },
              electricity: { enabled: stored.electricity !== false },
              exam: { enabled: stored.exam !== false },
              remit: { enabled: stored.remit !== false },
              invoice: { enabled: stored.invoice !== false },
              giftcard: { enabled: stored.giftcard !== false },
              transport: { enabled: stored.transport !== false },
              travel: { enabled: stored.travel !== false },
            });
          }
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch {
      setLoading(false);
    }
  }, []);

  /**
   * Helper to verify if a given service key is currently enabled.
   * @param {string} serviceKey
   * @returns {boolean}
   */
  const isServiceEnabled = (serviceKey) => {
    if (!serviceKey) return true;
    const lower = serviceKey.toLowerCase();
    const serviceConfig = services[lower];
    if (serviceConfig && typeof serviceConfig.enabled === 'boolean') {
      return serviceConfig.enabled;
    }
    return true;
  };

  return { services, isServiceEnabled, loading };
}

export default useServicesAvailability;
