import { useState, useEffect } from 'react';
import { fetchPageByPath } from '@/app/utils/drupalFetcher';
import { DrupalResponse } from '@/types/drupal';

/**
 * Hook for fetching page data by path alias
 * @param pathAlias The path alias to fetch (e.g., "/services", "/about")
 * @param fallbackIds Optional array of node IDs to try if path alias fails
 */
export function useDrupalPage(pathAlias: string, fallbackIds: number[] = []) {
  const [data, setData] = useState<DrupalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch data on mount or when dependencies change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchPageByPath(pathAlias, fallbackIds);
        setData(response);
      } catch (err) {
        const fetchError =
          err instanceof Error ? err : new Error('Failed to fetch page');
        setError(fetchError);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pathAlias, JSON.stringify(fallbackIds)]);

  // Function to trigger the fetch manually or refresh data
  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchPageByPath(pathAlias, fallbackIds);
      setData(response);
      return response;
    } catch (err) {
      const fetchError =
        err instanceof Error ? err : new Error('Failed to fetch page');
      setError(fetchError);
      return { data: [] };
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refetch,
  };
}
