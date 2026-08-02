import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  getDashboardSummary,
} from '../api/dashboard';

import type {
  DashboardSummary,
} from '../api/dashboard';

import {
  getApiError,
} from '../api/client';

export interface DashboardSummaryState {
  summary: DashboardSummary | null;
  days: number;
  setDays: (days: number) => void;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useDashboardSummary(
  initialDays = 30,
): DashboardSummaryState {
  const [
    summary,
    setSummary,
  ] =
    useState<DashboardSummary | null>(
      null,
    );

  const [
    days,
    setDays,
  ] =
    useState(initialDays);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(null);

  const reload =
    useCallback(
      async () => {
        try {
          setIsLoading(true);
          setError(null);

          const data =
            await getDashboardSummary(
              days,
            );

          setSummary(data);
        } catch (requestError) {
          setSummary(null);
          setError(
            getApiError(requestError),
          );
        } finally {
          setIsLoading(false);
        }
      },
      [days],
    );

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    summary,
    days,
    setDays,
    isLoading,
    error,
    reload,
  };
}
