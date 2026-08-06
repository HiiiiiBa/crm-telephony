import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_INTERVAL_MS = 30_000;

interface UseAutoRefreshOptions {
  intervalMs?: number;
  enabled?: boolean;
  /** Si false, seul l'intervalle déclenche les refresh (le parent gère le chargement initial). */
  fetchOnMount?: boolean;
}

/**
 * Exécute `onRefresh` au montage, puis à intervalle régulier.
 * La mise à jour automatique est suspendue lorsque l'onglet est masqué.
 */
export function useAutoRefresh(
  onRefresh: (silent: boolean) => Promise<void>,
  options: UseAutoRefreshOptions = {},
) {
  const { intervalMs = DEFAULT_INTERVAL_MS, enabled = true, fetchOnMount = true } = options;

  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [paused, setPaused] = useState(() =>
    typeof document !== 'undefined' ? document.hidden : false,
  );

  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const refresh = useCallback(async (silent = false) => {
    setRefreshing(true);
    try {
      await onRefreshRef.current(silent);
      setLastUpdated(new Date());
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    if (fetchOnMount) void refresh(false);

    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);

    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [enabled, fetchOnMount, refresh]);

  useEffect(() => {
    if (!enabled || paused) return;

    const id = window.setInterval(() => {
      void refresh(true);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [enabled, paused, intervalMs, refresh]);

  return { refresh, refreshing, lastUpdated, paused, intervalMs };
}

export function formatLastUpdated(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
