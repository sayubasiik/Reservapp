import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { getApiError } from '../api/client';
import {
  listCatalogItems,
} from './catalog';

import type {
  CatalogItem,
} from './catalog';

export interface UseCatalogResult {
  items: CatalogItem[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Loads the public catalog and exposes explicit
 * loading, error and retry states to the UI.
 */
export function useCatalog():
UseCatalogResult {
  const [items, setItems] =
    useState<CatalogItem[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
    async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data =
          await listCatalogItems();

        setItems(data);
      } catch (loadError) {
        setItems([]);
        setError(
          getApiError(loadError),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return {
    items,
    isLoading,
    error,
    reload: load,
  };
}
