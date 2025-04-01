import { useState, useEffect } from 'react';
import { fetchDrupalData } from '@/app/utils/drupalFetcher';
import { DrupalResponse, FetchOptions } from '@/types/drupal';

/**
 * Hook for fetching data from Drupal's JSON:API
 * @param endpoint The endpoint to fetch from (e.g., 'node/page')
 * @param options Options for the fetch request
 * @param skip If true, the fetch won't happen automatically
 */
export function useDrupalData(
  endpoint: string,
  options: FetchOptions = {},
  skip = false
) {
  const [data, setData] = useState<DrupalResponse | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);

  // Function to trigger the fetch manually or refresh data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchDrupalData(endpoint, options);
      setData(response);
      return response;
    } catch (err) {
      const fetchError =
        err instanceof Error ? err : new Error('Failed to fetch data');
      setError(fetchError);
      return { data: [] };
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount or when dependencies change
  useEffect(() => {
    if (skip) {
      setLoading(false);
      return;
    }

    fetchData();
  }, [endpoint, skip, JSON.stringify(options)]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData, // Expose setData to allow manual updates
  };
}
