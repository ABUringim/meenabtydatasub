import { useState, useEffect, useCallback } from 'react';
import { SystemHealthStats } from '../types';
import { storage } from '../services/storage';

export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealthStats>(() => storage.getSystemHealth());
  const [loading, setLoading] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  useEffect(() => {
    // Local & cross-tab sync
    const unsubStorage = storage.subscribeSystemHealth((data) => {
      setHealth(data);
    });

    return () => {
      unsubStorage();
    };
  }, []);

  const pingAggregator = useCallback(async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      // Simulated live health ping to VTU upstream gateway
      await new Promise((resolve) => setTimeout(resolve, 180));
      const latencyMs = Math.round(performance.now() - start);

      storage.updateSystemHealth({
        bigiSubApi: {
          ...health.bigiSubApi,
          status: 'healthy',
          latencyMs,
          lastPingAt: new Date().toISOString(),
        },
        overallStatus: 'operational',
      });
    } finally {
      setIsPinging(false);
    }
  }, [health]);

  const testWebhook = useCallback(async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      // Simulated live test ping to Paystack Webhook receiver
      await new Promise((resolve) => setTimeout(resolve, 120));
      const latencyMs = Math.round(performance.now() - start);

      storage.updateSystemHealth({
        paystackWebhook: {
          ...health.paystackWebhook,
          status: 'healthy',
          latencyMs,
          lastReceivedAt: new Date().toISOString(),
        },
        overallStatus: 'operational',
      });
    } finally {
      setIsPinging(false);
    }
  }, [health]);

  const refreshHealth = useCallback(() => {
    setLoading(true);
    const data = storage.getSystemHealth();
    setHealth(data);
    setLoading(false);
  }, []);

  return {
    health,
    loading,
    isPinging,
    pingAggregator,
    testWebhook,
    refreshHealth,
  };
}
